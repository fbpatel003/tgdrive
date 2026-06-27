import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient, FOLDER_TAG } from "./telegram";
import { db, pruneThumbCache } from "./db";
import type { CachedFile, CachedFolder } from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function toInputChannel(id: string, accessHash: string) {
  return new Api.InputChannel({ channelId: bigInt(id), accessHash: bigInt(accessHash) });
}

function toInputPeerChannel(id: string, accessHash: string) {
  return new Api.InputPeerChannel({ channelId: bigInt(id), accessHash: bigInt(accessHash) });
}

// ─── Metadata caption ─────────────────────────────────────────────────────────

interface FileMeta {
  v: 1;
  name: string;
  size: number;
  mime: string;
  uploadedAt: number;
}

function buildCaption(file: File): string {
  const meta: FileMeta = {
    v: 1,
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    uploadedAt: Date.now(),
  };
  return JSON.stringify(meta);
}

function parseCaption(caption: string | undefined): FileMeta | null {
  if (!caption) return null;
  try {
    const parsed = JSON.parse(caption);
    if (parsed?.v === 1) return parsed as FileMeta;
  } catch {}
  return null;
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export async function getFolders(): Promise<CachedFolder[]> {
  const client = await getClient();
  const dialogs = await client.getDialogs({ limit: 200 });
  const folders: CachedFolder[] = [];

  for (const dialog of dialogs) {
    const entity = dialog.entity;
    if (entity instanceof Api.Channel && entity.title?.startsWith(FOLDER_TAG)) {
      const folder: CachedFolder = {
        id: entity.id.toString(),
        title: entity.title.replace(FOLDER_TAG, "").trim(),
        accessHash: entity.accessHash?.toString() ?? "0",
        createdAt: Date.now(),
      };
      folders.push(folder);
      await db.folders.put(folder);
    }
  }
  return folders;
}

export async function createFolder(name: string): Promise<CachedFolder> {
  const client = await getClient();
  const result = await client.invoke(
    new Api.channels.CreateChannel({
      title: `${FOLDER_TAG} ${name}`,
      about: "Created by TGDrive",
      megagroup: false,
      broadcast: true,
    })
  );

  const chats = (result as Api.Updates).chats;
  if (!chats?.length) throw new Error("Failed to create folder");

  const channel = chats[0] as Api.Channel;
  const folder: CachedFolder = {
    id: channel.id.toString(),
    title: name,
    accessHash: channel.accessHash?.toString() ?? "0",
    createdAt: Date.now(),
  };
  await db.folders.put(folder);
  return folder;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const client = await getClient();
  const folder = await db.folders.get(folderId);
  if (!folder) return;

  await client.invoke(
    new Api.channels.DeleteChannel({ channel: toInputChannel(folderId, folder.accessHash) })
  );
  await db.folders.delete(folderId);
  await db.files.where("folderId").equals(folderId).delete();
  const fileIds = (await db.files.where("folderId").equals(folderId).primaryKeys()) as string[];
  await db.thumbs.bulkDelete(fileIds);
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function getFiles(folderId: string): Promise<CachedFile[]> {
  const client = await getClient();
  const folder = await db.folders.get(folderId);
  if (!folder) throw new Error("Folder not found");

  const peer = toInputPeerChannel(folderId, folder.accessHash);
  const messages = await client.getMessages(peer, { limit: 100 });
  const files: CachedFile[] = [];

  for (const msg of messages) {
    if (!msg.media) continue;

    const meta = parseCaption(msg.message);
    let name: string, size: number, mimeType: string, date: number;

    if (meta) {
      name = meta.name; size = meta.size; mimeType = meta.mime; date = meta.uploadedAt;
    } else {
      name = `file_${msg.id}`; size = 0; mimeType = "application/octet-stream"; date = msg.date * 1000;

      if (msg.media instanceof Api.MessageMediaDocument) {
        const doc = msg.media.document;
        if (doc instanceof Api.Document) {
          size = Number(doc.size);
          mimeType = doc.mimeType ?? mimeType;
          const nameAttr = doc.attributes.find(
            (a): a is Api.DocumentAttributeFilename => a instanceof Api.DocumentAttributeFilename
          );
          name = nameAttr?.fileName ?? name;
        }
      } else if (msg.media instanceof Api.MessageMediaPhoto) {
        name = `photo_${msg.id}.jpg`; mimeType = "image/jpeg";
      }
    }

    const file: CachedFile = {
      id: `${folderId}_${msg.id}`,
      folderId, messageId: msg.id, name, size, mimeType, date, mediaRef: "",
    };
    files.push(file);
    await db.files.put(file);
  }
  return files;
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

export async function getThumbnail(file: CachedFile): Promise<string | null> {
  // Only for images
  if (!file.mimeType.startsWith("image/")) return null;

  // Check cache
  const cached = await db.thumbs.get(file.id);
  if (cached) return cached.dataUrl;

  const client = await getClient();
  const folder = await db.folders.get(file.folderId);
  if (!folder) return null;

  const peer = toInputPeerChannel(file.folderId, folder.accessHash);
  const messages = await client.getMessages(peer, { ids: [file.messageId] });
  const msg = messages[0];
  if (!msg?.media) return null;

  try {
    // Download thumb index 0 (smallest available thumbnail)
    const data = await client.downloadMedia(msg.media, { thumb: 0 } as Parameters<typeof client.downloadMedia>[1]);
    if (!data) return null;

    const bytes = data as unknown as Uint8Array;
    const b64 = btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(""));
    const dataUrl = `data:image/jpeg;base64,${b64}`;

    await db.thumbs.put({ id: file.id, dataUrl, savedAt: Date.now() });
    // Prune cache asynchronously
    pruneThumbCache().catch(() => {});
    return dataUrl;
  } catch {
    return null;
  }
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadFile(
  folderId: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<CachedFile> {
  const client = await getClient();
  const folder = await db.folders.get(folderId);
  if (!folder) throw new Error("Folder not found");

  const peer = toInputPeerChannel(folderId, folder.accessHash);
  const uploadedFile = await client.uploadFile({ file, workers: 4, onProgress });

  const message = await client.sendFile(peer, {
    file: uploadedFile,
    caption: buildCaption(file),
    forceDocument: true,
    workers: 4,
  });

  const cachedFile: CachedFile = {
    id: `${folderId}_${message.id}`,
    folderId, messageId: message.id,
    name: file.name, size: file.size,
    mimeType: file.type || "application/octet-stream",
    date: Date.now(), mediaRef: "",
  };
  await db.files.put(cachedFile);
  return cachedFile;
}

// ─── Preview (images — full blob) ─────────────────────────────────────────────

export async function previewFile(file: CachedFile): Promise<string> {
  const client = await getClient();
  const folder = await db.folders.get(file.folderId);
  if (!folder) throw new Error("Folder not found");

  const peer = toInputPeerChannel(file.folderId, folder.accessHash);
  const messages = await client.getMessages(peer, { ids: [file.messageId] });
  if (!messages[0]?.media) throw new Error("File not found on Telegram");

  const data = await client.downloadMedia(messages[0].media, {});
  if (!data) throw new Error("Download failed");

  const blob = new Blob([data as ArrayBuffer], { type: file.mimeType });
  return URL.createObjectURL(blob);
}

// ─── Download ─────────────────────────────────────────────────────────────────

export async function downloadFile(file: CachedFile): Promise<void> {
  const client = await getClient();
  const folder = await db.folders.get(file.folderId);
  if (!folder) throw new Error("Folder not found");

  const peer = toInputPeerChannel(file.folderId, folder.accessHash);
  const messages = await client.getMessages(peer, { ids: [file.messageId] });
  if (!messages[0]?.media) throw new Error("File not found on Telegram");

  const data = await client.downloadMedia(messages[0].media, {});
  if (!data) throw new Error("Download failed");

  const blob = new Blob([data as ArrayBuffer], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = file.name; a.click();
  URL.revokeObjectURL(url);
}

export async function deleteFile(file: CachedFile): Promise<void> {
  const client = await getClient();
  const folder = await db.folders.get(file.folderId);
  if (!folder) throw new Error("Folder not found");

  const peer = toInputPeerChannel(file.folderId, folder.accessHash);
  await client.deleteMessages(peer, [file.messageId], { revoke: true });
  await db.files.delete(file.id);
  await db.thumbs.delete(file.id);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  type: "folder" | "file";
  folder?: CachedFolder;
  file?: CachedFile;
  folderId?: string;
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  const [folders, files] = await Promise.all([
    db.folders.toArray(),
    db.files.toArray(),
  ]);

  const results: SearchResult[] = [];

  for (const folder of folders) {
    if (folder.title.toLowerCase().includes(q)) {
      results.push({ type: "folder", folder });
    }
  }
  for (const file of files) {
    if (file.name.toLowerCase().includes(q)) {
      results.push({ type: "file", file, folderId: file.folderId });
    }
  }
  return results;
}