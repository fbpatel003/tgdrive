import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { PromisedWebSockets } from "telegram/extensions/PromisedWebSockets";
import type { AuthKey } from "telegram/crypto/AuthKey";
import { db } from "./db";

export const FOLDER_TAG = "[TGDrive]";

let _client: TelegramClient | null = null;

/**
 * Extends StringSession to persist BOTH the main session string AND
 * per-DC auth keys to IndexedDB.
 *
 * Root causes of AUTH_KEY_DUPLICATED:
 *
 * 1. StringSession.save() only returns a string — never writes back to
 *    storage. When GramJS regenerates the main auth key, the new key
 *    exists on Telegram's server but the old one stays in IndexedDB.
 *    Next refresh → key mismatch → DUPLICATED.
 *    Fix: override save() to persist to IndexedDB immediately.
 *
 * 2. StringSession only stores ONE auth key (for the main DC). Secondary
 *    DC connections (e.g. DC2 for uploads/downloads) get a new key every
 *    time because getAuthKey(dc2) returns undefined.
 *    Fix: maintain a per-DC key map, persist it to IndexedDB.
 */
class PersistentSession extends StringSession {
  private _dcKeys: Map<number, AuthKey> = new Map();

  override save(): string {
    const str = super.save();
    if (str) {
      db.credentials.get(1).then((creds) => {
        if (creds && creds.sessionString !== str) {
          db.credentials.put({ ...creds, sessionString: str });
        }
      });
    }
    return str;
  }

  override getAuthKey(dcId?: number): AuthKey | undefined {
    if (dcId && dcId !== this.dcId) {
      return this._dcKeys.get(dcId);
    }
    return super.getAuthKey(dcId);
  }

  override setAuthKey(authKey?: AuthKey, dcId?: number): undefined {
    if (dcId && dcId !== this.dcId) {
      if (authKey) {
        this._dcKeys.set(dcId, authKey);
        this._persistDcKeys();
      } else {
        this._dcKeys.delete(dcId);
      }
      return undefined;
    }
    return super.setAuthKey(authKey, dcId);
  }

  private _persistDcKeys() {
    const entries: Record<string, string> = {};
    this._dcKeys.forEach((key, dcId) => {
      const raw = key.getKey();
      if (raw) {
        // raw is a Node Buffer — convert to hex string for storage
        entries[String(dcId)] = (raw as unknown as { toString: (enc: string) => string }).toString("hex");
      }
    });
    db.credentials.get(1).then((creds) => {
      if (creds) {
        db.credentials.put({ ...creds, dcKeys: JSON.stringify(entries) });
      }
    });
  }

  async loadDcKeys(serialized: string) {
    if (!serialized) return;
    const { AuthKey: AK } = await import("telegram/crypto/AuthKey");
    const entries: Record<string, string> = JSON.parse(serialized);
    for (const [dcIdStr, hex] of Object.entries(entries)) {
      const key = new AK();
      // Convert hex back to Uint8Array-compatible buffer via polyfilled Buffer
      const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
      await key.setKey(bytes as unknown as Parameters<typeof key.setKey>[0]);
      this._dcKeys.set(Number(dcIdStr), key);
    }
  }
}

export async function getClient(): Promise<TelegramClient> {
  if (_client?.connected) return _client;

  const creds = await db.credentials.get(1);
  if (!creds) throw new Error("NOT_AUTHENTICATED");

  const session = new PersistentSession(creds.sessionString);

  if (creds.dcKeys) {
    await session.loadDcKeys(creds.dcKeys);
  }

  _client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 5,
    useWSS: true,
    networkSocket: PromisedWebSockets,
  });

  try {
    await _client.connect();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("AUTH_KEY_DUPLICATED") ||
      msg.includes("AUTH_KEY_UNREGISTERED") ||
      msg.includes("AUTH_KEY_INVALID")
    ) {
      // Clear only DC keys, not full credentials — avoids forcing full re-login
      const c = await db.credentials.get(1);
      if (c) {
        const cleaned = { ...c };
        delete cleaned.dcKeys;
        await db.credentials.put(cleaned);
      }
      _client = null;
      throw new Error("SESSION_EXPIRED");
    }
    throw e;
  }

  return _client;
}

export function resetClient() {
  _client?.disconnect();
  _client = null;
}