import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient } from "./telegram";
import { db } from "./db";
import type { CachedFile } from "./db";

// Chunk size for streaming — 512KB per request, good balance of
// latency vs request count. GramJS min is 128KB, max is 512KB.
const CHUNK_SIZE = 512 * 1024;

/**
 * Streams a Telegram file into a MediaSource and returns a blob:// URL
 * that can be used as a <video src>. The video starts playing after the
 * first chunk arrives — the rest streams in the background.
 *
 * Returns a cleanup function to abort streaming and revoke the URL.
 */
export async function streamVideoToMediaSource(
  file: CachedFile,
  onError: (msg: string) => void
): Promise<{ url: string; stop: () => void }> {
  const client = await getClient();
  const folder = await db.folders.get(file.folderId);
  if (!folder) throw new Error("Folder not found");

  // Fetch the message so we have the media object
  const peer = new Api.InputPeerChannel({
    channelId: bigInt(file.folderId),
    accessHash: bigInt(folder.accessHash),
  });
  const messages = await client.getMessages(peer, { ids: [file.messageId] });
  const msg = messages[0];
  if (!msg?.media) throw new Error("File not found on Telegram");

  // Get mime type — prefer what's stored, fall back to video/mp4
  const mimeType = file.mimeType.startsWith("video/") ? file.mimeType : "video/mp4";

  // Check MediaSource support
  if (!window.MediaSource || !MediaSource.isTypeSupported(mimeType)) {
    // Fallback: full download
    const data = await client.downloadMedia(msg.media, {});
    if (!data) throw new Error("Download failed");
    const blob = new Blob([data as ArrayBuffer], { type: mimeType });
    return { url: URL.createObjectURL(blob), stop: () => {} };
  }

  const mediaSource = new MediaSource();
  const url = URL.createObjectURL(mediaSource);
  let aborted = false;

  const stop = () => {
    aborted = true;
    if (mediaSource.readyState === "open") {
      try { mediaSource.endOfStream(); } catch {}
    }
  };

  mediaSource.addEventListener("sourceopen", async () => {
    let sourceBuffer: SourceBuffer;
    try {
      sourceBuffer = mediaSource.addSourceBuffer(mimeType);
    } catch {
      // Codec not supported — fall back handled by caller
      onError(`Codec not supported for ${mimeType}. Try downloading instead.`);
      return;
    }

    sourceBuffer.mode = "sequence";

    const appendChunk = (chunk: ArrayBuffer): Promise<void> =>
      new Promise((resolve, reject) => {
        const onUpdate = () => {
          sourceBuffer.removeEventListener("updateend", onUpdate);
          sourceBuffer.removeEventListener("error", onErr);
          resolve();
        };
        const onErr = () => {
          sourceBuffer.removeEventListener("updateend", onUpdate);
          sourceBuffer.removeEventListener("error", onErr);
          reject(new Error("SourceBuffer append error"));
        };
        sourceBuffer.addEventListener("updateend", onUpdate);
        sourceBuffer.addEventListener("error", onErr);
        sourceBuffer.appendBuffer(chunk);
      });

    try {
      // iterDownload yields Buffer chunks from Telegram
      for await (const chunk of client.iterDownload({
        file: msg.media as Api.TypeMessageMedia,
        requestSize: CHUNK_SIZE,
        chunkSize: CHUNK_SIZE,
        fileSize: file.size ? bigInt(file.size) : undefined,
        msgData: msg.inputChat ? [msg.inputChat, msg.id] : undefined,
      })) {
        if (aborted) break;
        // Wait if buffer is busy
        while (sourceBuffer.updating) {
          await new Promise<void>((r) => {
            sourceBuffer.addEventListener("updateend", () => r(), { once: true });
          });
        }
        // GramJS yields Node Buffer objects — extract underlying ArrayBuffer
        const raw = chunk as unknown as { buffer: ArrayBuffer; byteOffset: number; byteLength: number };
        const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
        await appendChunk(ab);
      }
    } catch (e: unknown) {
      if (!aborted) {
        onError(e instanceof Error ? e.message : "Stream error");
      }
    }

    if (!aborted && mediaSource.readyState === "open") {
      while (sourceBuffer.updating) {
        await new Promise<void>((r) => {
          sourceBuffer.addEventListener("updateend", () => r(), { once: true });
        });
      }
      try { mediaSource.endOfStream(); } catch {}
    }
  });

  return { url, stop };
}