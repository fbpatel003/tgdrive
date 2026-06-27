import Dexie from "dexie";
import type { Table } from "dexie";

export interface TGCredentials {
  id: number;
  apiId: number;
  apiHash: string;
  sessionString: string;
  phone: string;
  dcKeys?: string;
}

export interface CachedFolder {
  id: string;
  title: string;
  accessHash: string;
  createdAt: number;
}

export interface CachedFile {
  id: string;
  folderId: string;
  messageId: number;
  name: string;
  size: number;
  mimeType: string;
  date: number;
  mediaRef: string;
}

export interface CachedThumb {
  id: string;       // same as CachedFile.id
  dataUrl: string;  // base64 data URL
  savedAt: number;  // ms timestamp for TTL eviction
}

class TGDriveDB extends Dexie {
  credentials!: Table<TGCredentials>;
  folders!: Table<CachedFolder>;
  files!: Table<CachedFile>;
  thumbs!: Table<CachedThumb>;

  constructor() {
    super("tgdrive");
    this.version(1).stores({
      credentials: "id",
      folders: "id, title",
      files: "id, folderId, name, date",
    });
    this.version(2).stores({
      credentials: "id",
      folders: "id, title",
      files: "id, folderId, name, date",
    });
    this.version(3).stores({
      credentials: "id",
      folders: "id, title",
      files: "id, folderId, name, date",
      thumbs: "id, savedAt",
    });
  }
}

export const db = new TGDriveDB();

// ── Thumbnail TTL eviction ────────────────────────────────────────────────────
// Keep at most MAX_THUMBS entries. If exceeded, delete oldest by savedAt.
const MAX_THUMBS = 200;
const THUMB_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function pruneThumbCache() {
  const now = Date.now();
  // Delete expired
  await db.thumbs.where("savedAt").below(now - THUMB_TTL_MS).delete();
  // Delete oldest if over limit
  const count = await db.thumbs.count();
  if (count > MAX_THUMBS) {
    const overflow = count - MAX_THUMBS;
    const oldest = await db.thumbs.orderBy("savedAt").limit(overflow).primaryKeys();
    await db.thumbs.bulkDelete(oldest as string[]);
  }
}