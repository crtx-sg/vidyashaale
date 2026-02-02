export interface StorageProvider {
  upload(file: Buffer, path: string, mimeType?: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expirySeconds: number): Promise<string>;
  exists(path: string): Promise<boolean>;
}
