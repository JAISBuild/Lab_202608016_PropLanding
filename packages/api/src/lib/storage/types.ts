export interface StorageProvider {
  save(key: string, data: Buffer, contentType?: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  read(key: string): Promise<Buffer>;
  createReadStream(key: string): NodeJS.ReadableStream;
  getPublicUrl(key: string): string | null;
  getSignedUploadUrl?(key: string, contentType: string, expiresIn?: number): Promise<string>;
}

export interface ImageVariants {
  original: string;
  large?: string;
  medium?: string;
  thumb?: string;
  width?: number;
  height?: number;
}
