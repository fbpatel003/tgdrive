import Dexie from "dexie";
import type { Table } from "dexie";

export interface TGCredentials {
  id: number;
  apiId: number;
  apiHash: string;
  sessionString: string;
  phone: string;
  dcKeys?: string; // JSON: { [dcId: string]: hexString }
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

class TGDriveDB extends Dexie {
  credentials!: Table<TGCredentials>;
  folders!: Table<CachedFolder>;
  files!: Table<CachedFile>;

  constructor() {
    super("tgdrive");
    this.version(1).stores({
      credentials: "id",
      folders: "id, title",
      files: "id, folderId, name, date",
    });
    // v2 adds dcKeys column (non-indexed, just stored)
    this.version(2).stores({
      credentials: "id",
      folders: "id, title",
      files: "id, folderId, name, date",
    });
  }
}

export const db = new TGDriveDB();