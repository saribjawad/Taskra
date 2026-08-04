import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import logger from '../utils/logger';

// AWS s3 Client
const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export type FILE_TYPE = 'image' | 'pdf' | 'document';

// For uploading a file to s3
export async function uploadFileToS3(
  type: FILE_TYPE,
  key: string,
  filePath: Buffer,
) {
  // Content type
  const command = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
    Body: filePath,
    ContentType: type,
  });

  try {
    const response = await s3.send(command);

    return response;
  } catch (error) {
    if (
      error instanceof S3ServiceException &&
      error.name === 'EntityTooLarge'
    ) {
      logger.error(
        `Error from S3 while uploading object to ${env.AWS_BUCKET_NAME}. \
        The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
        or the multipart upload API (5TB max).`,
      );
    } else if (error instanceof S3ServiceException) {
      logger.error(
        `Error from S3 while uploading object to ${env.AWS_BUCKET_NAME}.  ${error.name}: ${error.message}`,
      );
    } else {
      throw error;
    }
  }
}

export async function generatePresignedUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3, command);
    return url;
  } catch (error) {
    logger.error('An error occured while generating presigned url', error);
    throw error;
  }
}
