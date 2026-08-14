import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOAD_URL_EXPIRY_SECONDS = 300;
const DOWNLOAD_URL_EXPIRY_SECONDS = 3600;

let client: S3Client | undefined;
let bucketName: string | undefined;

// Lazy on purpose: unlike src/db/client.ts's eager DATABASE_URL check,
// R2 credentials are only needed on the document upload/download path, not by
// nearly every page. Throwing here at module load time (rather than on first
// actual use) would break `pnpm build`/`pnpm typecheck` for the whole app before
// R2 is configured, since Next.js imports every route module while collecting
// page data.
function getR2Client(): { client: S3Client; bucketName: string } {
  if (client && bucketName) {
    return { client, bucketName };
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME in .env.local (see .env.example).",
    );
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  bucketName = bucket;

  return { client, bucketName };
}

export async function getUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const { client, bucketName } = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });
}

export async function getDownloadUrl(key: string): Promise<string> {
  const { client, bucketName } = getR2Client();
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return getSignedUrl(client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
  });
}
