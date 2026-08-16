import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import type { StorageProvider } from "./types";

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    this.bucket = process.env.S3_BUCKET ?? "proplanding";
    this.publicBaseUrl =
      process.env.CDN_URL || process.env.S3_PUBLIC_URL || `https://${this.bucket}.s3.amazonaws.com`;

    this.client = new S3Client({
      region: process.env.S3_REGION ?? "us-east-1",
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async save(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async read(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  createReadStream(key: string): NodeJS.ReadableStream {
    throw new Error("Use redirect to CDN for S3 public assets");
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
