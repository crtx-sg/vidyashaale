import { createClient } from '@insforge/sdk';
import { StorageProvider } from './interface';

type InsforgeClient = ReturnType<typeof createClient>;

export class InsforgeStorageProvider implements StorageProvider {
  private client: InsforgeClient;
  private bucket: string;

  constructor(config: { url: string; anonKey: string; bucket: string }) {
    this.client = createClient({ baseUrl: config.url, anonKey: config.anonKey });
    this.bucket = config.bucket;
  }

  async upload(file: Buffer, path: string, mimeType?: string): Promise<string> {
    const blob = new Blob([file], mimeType ? { type: mimeType } : undefined);
    const { error } = await this.client.storage.from(this.bucket).upload(path, blob);
    if (error) throw new Error(`InsForge upload failed: ${error.message}`);
    return path;
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucket).download(path);
    if (error || !data) {
      throw new Error(`InsForge download failed: ${error?.message ?? 'no data returned'}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove(path);
    if (error) throw new Error(`InsForge delete failed: ${error.message}`);
  }

  // The public InsForge SDK does not expose signed URLs. Downloads for INSFORGE
  // are proxied through the resource service (see download route) to keep the
  // bucket private.
  async getSignedUrl(_path: string, _expirySeconds: number): Promise<string> {
    throw new Error('InsForge backend does not support signed URLs; stream through the service instead');
  }

  async exists(path: string): Promise<boolean> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list({ prefix: path, limit: 1 });
    if (error || !data) return false;
    const objects = (data as unknown as { objects?: Array<{ key: string }> }).objects ?? [];
    return objects.some((o) => o.key === path);
  }
}
