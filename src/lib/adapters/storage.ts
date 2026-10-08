/**
 * Cloudflare R2 through the S3 API.  Seam 2.
 *
 * R2 is chosen for one reason that dominates everything else: EGRESS IS FREE
 * at any volume (HLD-FREE-TIER.md §2.1). Product photography, spec sheets and
 * CAD files are the heavy bytes on this site, and keeping them off the host
 * keeps the bandwidth quota a non-issue.
 *
 * Swapping to S3 proper means changing the endpoint in this file. Nothing
 * outside it imports the AWS SDK.
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { NotConfiguredError, UpstreamError } from "@/core";
import type { StoragePort, StoredObject } from "@/core";
import { capabilities, env } from "../env";

const REQUIRED_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
] as const;

export class R2StorageAdapter implements StoragePort {
  private client: S3Client | null = null;

  private s3(): S3Client {
    if (!capabilities.storage) {
      throw new NotConfiguredError("storage", REQUIRED_VARS);
    }
    this.client ??= new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
    return this.client;
  }

  private bucket(): string {
    return env.R2_BUCKET!;
  }

  async put(
    key: string,
    body: Uint8Array | Buffer,
    contentType: string,
  ): Promise<StoredObject> {
    try {
      await this.s3().send(
        new PutObjectCommand({
          Bucket: this.bucket(),
          Key: key,
          Body: body,
          ContentType: contentType,
          // Media is immutable: a new version gets a new key, so it can be
          // cached forever and never revalidated.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return { key, size: body.byteLength, contentType };
    } catch (cause) {
      throw new UpstreamError("r2", `failed to put '${key}'`, cause);
    }
  }

  async signedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    try {
      return await getSignedUrl(
        this.s3(),
        new PutObjectCommand({
          Bucket: this.bucket(),
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: expiresInSeconds },
      );
    } catch (cause) {
      throw new UpstreamError("r2", `failed to sign upload for '${key}'`, cause);
    }
  }

  async signedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    try {
      return await getSignedUrl(
        this.s3(),
        new GetObjectCommand({ Bucket: this.bucket(), Key: key }),
        { expiresIn: expiresInSeconds },
      );
    } catch (cause) {
      throw new UpstreamError("r2", `failed to sign download for '${key}'`, cause);
    }
  }

  publicUrl(key: string): string {
    const base = env.R2_PUBLIC_BASE_URL;
    if (!base) throw new NotConfiguredError("storage.publicUrl", ["R2_PUBLIC_BASE_URL"]);
    return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3().send(
        new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }),
      );
    } catch (cause) {
      throw new UpstreamError("r2", `failed to delete '${key}'`, cause);
    }
  }
}

/**
 * Used when storage is not configured. Every method fails with the same
 * actionable error rather than a cryptic SDK stack — the operator learns
 * exactly which variables are missing.
 *
 * This is the Null Object pattern: the composition root always has a
 * StoragePort, so no call site needs a null check.
 */
export class UnconfiguredStorageAdapter implements StoragePort {
  private fail(): never {
    throw new NotConfiguredError("storage", REQUIRED_VARS);
  }

  put(): Promise<StoredObject> {
    this.fail();
  }
  signedUploadUrl(): Promise<string> {
    this.fail();
  }
  signedDownloadUrl(): Promise<string> {
    this.fail();
  }
  publicUrl(): string {
    this.fail();
  }
  delete(): Promise<void> {
    this.fail();
  }
}
