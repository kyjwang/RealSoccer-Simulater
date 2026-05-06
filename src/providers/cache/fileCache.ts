import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

type CacheEntry<T> = {
  cachedAt: string;
  expiresAt: string;
  data: T;
};

const CACHE_ROOT = path.join(process.cwd(), ".cache", "api-football");

const safeKey = (key: string): string => key.replace(/[^a-zA-Z0-9_.-]/g, "_");

export const readCache = async <T>(key: string): Promise<CacheEntry<T> | null> => {
  try {
    const raw = await readFile(path.join(CACHE_ROOT, `${safeKey(key)}.json`), "utf8");
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
};

export const writeCache = async <T>(key: string, data: T, ttlMs: number): Promise<CacheEntry<T>> => {
  const entry: CacheEntry<T> = {
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    data
  };

  await mkdir(CACHE_ROOT, { recursive: true });
  await writeFile(path.join(CACHE_ROOT, `${safeKey(key)}.json`), JSON.stringify(entry, null, 2), "utf8");
  return entry;
};

export const isFresh = (entry: CacheEntry<unknown>): boolean => new Date(entry.expiresAt).getTime() > Date.now();
