import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, extname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const USER_AGENT = 'Kybyra/0.1 (https://kybyra.app; dev contact)';

/** Returns the file extension to use locally based on the source URL. */
export function pickExtension(url: string): string {
  const ext = extname(new URL(url).pathname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
    return ext === '.jpeg' ? '.jpg' : ext;
  }
  return '.jpg';
}

/** Downloads `url` to `targetPath` (creating parent dirs). Skips if target already exists. */
export async function downloadFile(url: string, targetPath: string): Promise<{ skipped: boolean }> {
  try {
    const s = await stat(targetPath);
    if (s.size > 0) return { skipped: true };
  } catch {
    // not present
  }

  await mkdir(dirname(targetPath), { recursive: true });

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }

  await pipeline(Readable.fromWeb(res.body as unknown as ReadableStream), createWriteStream(targetPath));
  return { skipped: false };
}
