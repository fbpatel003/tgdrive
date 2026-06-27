import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient } from "./telegram";
import { db } from "./db";
import type { CachedFile } from "./db";

const CHUNK_SIZE = 512 * 1024; // 512 KB per request

/**
 * Progressive video loader using GramJS iterDownload.
 *
 * Strategy: collect chunks as they arrive, keep creating new Blob URLs
 * from accumulated data so the video element can start playing early
 * without waiting for the full download. When done, the final URL covers
 * the whole file.
 *
 * Why not MediaSource? MSE requires exact codec strings
 * (e.g. `video/mp4; codecs="avc1.42E01E,mp4a.40.2"`) and rejects
 * anything it can't parse. Without remuxing we can't reliably supply
 * those strings for arbitrary user files, so MSE fails silently on most
 * real-world uploads. The blob approach works with every format the
 * browser's native <video> supports.
 */
export async function streamVideo(
  file: CachedFile,
  onProgress: (pct: number) => void,
  onUrl: (url: string) => void,
  signal: AbortSignal
): Promise<void> {
  const client = await getClient();
  const folder = await db.folders.get(file.folderId);
  if (!folder) throw new Error("Folder not found");

  const peer = new Api.InputPeerChannel({
    channelId: bigInt(file.folderId),
    accessHash: bigInt(folder.accessHash),
  });

  const messages = await client.getMessages(peer, { ids: [file.messageId] });
  const msg = messages[0];
  if (!msg?.media) throw new Error("File not found on Telegram");

  const chunks: ArrayBuffer[] = [];
  let downloaded = 0;
  const total = file.size || 0;
  let lastUrlUpdate = 0;

  for await (const chunk of client.iterDownload({
    file: msg.media as Api.TypeMessageMedia,
    requestSize: CHUNK_SIZE,
    chunkSize: CHUNK_SIZE,
    fileSize: total ? bigInt(total) : undefined,
    msgData: msg.inputChat ? [msg.inputChat, msg.id] : undefined,
  })) {
    if (signal.aborted) return;

    const raw = chunk as unknown as { buffer: ArrayBuffer; byteOffset: number; byteLength: number };
    const slice = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    chunks.push(slice);
    downloaded += slice.byteLength;

    if (total) onProgress(downloaded / total);

    // Emit a playable URL every ~4 MB so the player can start early
    const now = Date.now();
    if (chunks.length === 1 || now - lastUrlUpdate > 1000) {
      const blob = new Blob(chunks, { type: file.mimeType });
      onUrl(URL.createObjectURL(blob));
      lastUrlUpdate = now;
    }
  }

  if (signal.aborted) return;

  // Final complete blob
  const blob = new Blob(chunks, { type: file.mimeType });
  onUrl(URL.createObjectURL(blob));
  onProgress(1);
}