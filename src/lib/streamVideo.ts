import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient } from "./telegram";
import { db } from "./db";
import type { CachedFile } from "./db";

const CHUNK_SIZE = 512 * 1024; // 512 KB per request
// How many chunks to buffer before giving the video a URL to play
// 3 × 512 KB = ~1.5 MB — enough for the browser to start decoding
const CHUNKS_BEFORE_PLAY = 3;

/**
 * Downloads a Telegram video in chunks and streams it to a <video> element.
 *
 * Key insight: a Blob URL is a snapshot — once created it can't be extended.
 * So we collect ALL chunks first, then hand ONE blob URL to the video element.
 * The video plays immediately from that single stable URL with no restarts.
 *
 * onUrl() is called exactly ONCE — after CHUNKS_BEFORE_PLAY chunks arrive,
 * so playback starts early while the rest downloads silently in background.
 * The blob at that point only has partial data, but browsers buffer-ahead
 * naturally and will stall/wait when they reach the end of buffered data.
 *
 * To avoid the stall we swap to the complete blob URL when fully done —
 * but ONLY if the video is paused or at the very beginning (to avoid restart).
 * Otherwise we leave the partial blob and the user just can't seek past it.
 */
export async function streamVideo(
  file: CachedFile,
  onProgress: (pct: number) => void,
  onUrl: (url: string, isFinal: boolean) => void,
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
  let earlyUrlGiven = false;
  let earlyUrl: string | null = null;

  for await (const chunk of client.iterDownload({
    file: msg.media as Api.TypeMessageMedia,
    requestSize: CHUNK_SIZE,
    chunkSize: CHUNK_SIZE,
    fileSize: total ? bigInt(total) : undefined,
    msgData: msg.inputChat ? [msg.inputChat, msg.id] : undefined,
  })) {
    if (signal.aborted) {
      if (earlyUrl) URL.revokeObjectURL(earlyUrl);
      return;
    }

    const raw = chunk as unknown as { buffer: ArrayBuffer; byteOffset: number; byteLength: number };
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    chunks.push(ab);
    downloaded += ab.byteLength;
    if (total) onProgress(downloaded / total);

    // Give the video a URL after first N chunks so it starts playing early
    if (!earlyUrlGiven && chunks.length >= CHUNKS_BEFORE_PLAY) {
      earlyUrlGiven = true;
      const blob = new Blob(chunks, { type: file.mimeType });
      earlyUrl = URL.createObjectURL(blob);
      onUrl(earlyUrl, false);
    }
  }

  if (signal.aborted) {
    if (earlyUrl) URL.revokeObjectURL(earlyUrl);
    return;
  }

  // Build the complete blob
  const finalBlob = new Blob(chunks, { type: file.mimeType });
  const finalUrl = URL.createObjectURL(finalBlob);

  if (!earlyUrlGiven) {
    // Small file — completed before CHUNKS_BEFORE_PLAY, give url now
    onUrl(finalUrl, true);
  } else {
    // Swap to complete blob so seeking works across the full file
    // PreviewModal will only swap src if video is paused or at start
    if (earlyUrl) URL.revokeObjectURL(earlyUrl);
    onUrl(finalUrl, true);
  }

  onProgress(1);
}