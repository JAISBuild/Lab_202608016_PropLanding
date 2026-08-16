import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import type { StorageProvider } from "./types";

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root = UPLOAD_ROOT) {
    this.root = root;
  }

  private resolve(key: string): string {
    return path.join(this.root, key);
  }

  async save(key: string, data: Buffer, _contentType?: string): Promise<void> {
    const fullPath = this.resolve(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.resolve(key));
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  createReadStream(key: string): NodeJS.ReadableStream {
    return createReadStream(this.resolve(key));
  }

  getPublicUrl(_key: string): string | null {
    return null;
  }
}
