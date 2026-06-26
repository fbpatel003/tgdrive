import { Api } from "telegram";
import bigInt from "big-integer";
import { getClient, FOLDER_TAG } from "./telegram";
import { db } from "./db";
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
  return new Api.InputChannel({
    channelId: bigInt(id),
    accessHash: bigInt(accessHash),
  });
}

function toInputPeerChannel(id: string, accessHash: string) {
  return new Api.InputPeerChannel({
    channelId: bigInt(id),
    accessHash: bigInt(accessHash),
  });
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export async function getFolders(): Promise<CachedFolder[]> {
  const client = await getClient();
  const dialogs = await client.getDialogs({ limit: 200 });
  const folders: CachedFolder[] = [];

  for (const dialog of dialogs) {
    const entity = dialog.entity;
    if (
      entity instanceof Api.Channel &&
      entity.title?.startsWith(FOLDER_TAG)
    ) {
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
  if (!chats || chats.length === 0) throw new Error("Failed to create folder");

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
    new Api.channels.DeleteChannel({
      channel: toInputChannel(folderId, folder.accessHash),
    })
  );

  await db.folders.delete(folderId);
  await db.files.where("folderId").equals(folderId).delete();
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

    // ── Try our JSON caption first ──────────────────────────────────────────
    const meta = parseCaption(msg.message);

    let name: string;
    let size: number;
    let mimeType: string;
    let date: number;

    if (meta) {
      name     = meta.name;
      size     = meta.size;
      mimeType = meta.mime;
      date     = meta.uploadedAt;
    } else {
      // ── Fallback: parse Telegram document attributes (old files) ──────────
      name     = `file_${msg.id}`;
      size     = 0;
      mimeType = "application/octet-stream";
      date     = msg.date * 1000;

      if (msg.media instanceof Api.MessageMediaDocument) {
        const doc = msg.media.document;
        if (doc instanceof Api.Document) {
          size     = Number(doc.size);
          mimeType = doc.mimeType ?? mimeType;
          const nameAttr = doc.attributes.find(
            (a): a is Api.DocumentAttributeFilename =>
              a instanceof Api.DocumentAttributeFilename
          );
          name = nameAttr?.fileName ?? name;
        }
      } else if (msg.media instanceof Api.MessageMediaPhoto) {
        name     = `photo_${msg.id}.jpg`;
        mimeType = "image/jpeg";
      }
    }

    const file: CachedFile = {
      id: `${folderId}_${msg.id}`,
      folderId,
      messageId: msg.id,
      name,
      size,
      mimeType,
      date,
      mediaRef: "",
    };
    files.push(file);
    await db.files.put(file);
  }

  return files;
}

// ─── Metadata caption format ──────────────────────────────────────────────────
// Every file we upload gets this JSON as its Telegram caption.
// On retrieval we parse it; if it's not present (old files) we fall back
// to Telegram's document attributes.

interface FileMeta {
  v: 1;                 // schema version
  name: string;
  size: number;
  mime: string;
  uploadedAt: number;   // unix ms
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

  const uploadedFile = await client.uploadFile({
    file,
    workers: 4,
    onProgress,
  });

  const message = await client.sendFile(peer, {
    file: uploadedFile,
    caption: buildCaption(file),
    forceDocument: true,
    workers: 4,
  });

  const cachedFile: CachedFile = {
    id: `${folderId}_${message.id}`,
    folderId,
    messageId: message.id,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    date: Date.now(),
    mediaRef: "",
  };
  await db.files.put(cachedFile);
  return cachedFile;
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
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

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

export async function deleteFile(file: CachedFile): Promise<void> {
  const client = await getClient();
  const folder = await db.folders.get(file.folderId);
  if (!folder) throw new Error("Folder not found");

  const peer = toInputPeerChannel(file.folderId, folder.accessHash);
  await client.deleteMessages(peer, [file.messageId], { revoke: true });
  await db.files.delete(file.id);
}