import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '@/config/environment';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size?: number;
  contentType?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number;
  contentType?: string;
  contentLength?: number;
}

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    // Configure for Contabo S3-compatible storage
    this.s3Client = new S3Client({
      region: config.CONTABO_REGION,
      credentials: {
        accessKeyId: config.CONTABO_ACCESS_KEY,
        secretAccessKey: config.CONTABO_SECRET_KEY,
      },
      endpoint: config.CONTABO_ENDPOINT,
      forcePathStyle: true, // Required for Contabo
    });

    this.bucket = config.CONTABO_BUCKET_NAME;

    if (!this.bucket) {
      throw new Error('Contabo bucket name is required');
    }
  }

  /**
   * Generate a unique file key
   */
  private generateFileKey(originalName: string, folder?: string): string {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    
    const fileName = `${name}-${timestamp}-${uuid}${ext}`;
    
    if (folder) {
      return `${folder}/${fileName}`;
    }
    
    return fileName;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Buffer | Uint8Array | string,
    originalName: string,
    contentType: string,
    folder?: string
  ): Promise<UploadResult> {
    try {
      const key = this.generateFileKey(originalName, folder);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read', // Make files public for Contabo S3
      });

      await this.s3Client.send(command);

      const url = S3Service.generatePublicUrl(key);

      logger.info('File uploaded successfully', {
        key,
        bucket: this.bucket,
        url
      });

      return {
        key,
        url,
        bucket: this.bucket,
        contentType
      };
    } catch (error) {
      logger.error('Error uploading file to S3', { error, originalName, folder });
      throw new AppError('Failed to upload file', 500);
    }
  }

  /**
   * Get presigned URL for upload
   */
  async getPresignedUploadUrl(
    fileName: string,
    contentType: string,
    folder?: string,
    options: PresignedUrlOptions = {}
  ): Promise<{ uploadUrl: string; key: string; expiresAt: Date }> {
    try {
      const key = this.generateFileKey(fileName, folder);
      const { expiresIn = 3600, contentLength } = options; // 1 hour default

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(contentType)) {
        throw new AppError(`File type ${contentType} is not allowed`, 400);
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
        ACL: 'public-read',
        Metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          contentType: contentType
        }
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      logger.info('Generated presigned upload URL', {
        key,
        expiresIn,
        expiresAt: expiresAt.toISOString(),
        contentType,
        fileName
      });

      return {
        uploadUrl,
        key,
        expiresAt
      };
    } catch (error) {
      logger.error('Error generating presigned upload URL', { error, fileName, folder, contentType });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate upload URL', 500);
    }
  }

  /**
   * Generate public URL for uploaded file
   */
  static generatePublicUrl(key: string): string {
    // Contabo S3 public URL format: https://region.contabostorage.com/accessKey:bucket/fileKey
    const publicUrl = `https://${config.CONTABO_REGION}.contabostorage.com/${config.CONTABO_ACCESS_KEY}:${config.CONTABO_BUCKET_NAME}/${key}`;
    
    logger.info('Generated public URL', {
      key,
      region: config.CONTABO_REGION,
      accessKey: config.CONTABO_ACCESS_KEY ? 'present' : 'missing',
      bucket: config.CONTABO_BUCKET_NAME,
      publicUrl
    });
    
    return publicUrl;
  }

  /**
   * Generate presigned URL for viewing file
   */
  async generateViewUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const viewUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return viewUrl;
    } catch (error) {
      logger.error('Error generating view URL', { error, key });
      throw new AppError('Failed to generate view URL', 500);
    }
  }

  /**
   * Get presigned URL for download
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    try {
      // First check if file exists
      const exists = await this.fileExists(key);
      if (!exists) {
        throw new AppError('File not found', 404);
      }

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      logger.info('Generated presigned download URL', {
        key,
        expiresIn,
        expiresAt: expiresAt.toISOString()
      });

      return {
        downloadUrl,
        expiresAt
      };
    } catch (error) {
      logger.error('Error generating presigned download URL', { error, key });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate download URL', 500);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      
      logger.info('File deleted successfully', { key, bucket: this.bucket });
    } catch (error) {
      logger.error('Error deleting file from S3', { error, key });
      throw new AppError('Failed to delete file', 500);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      logger.error('Error checking file existence', { error, key });
      throw new AppError('Failed to check file existence', 500);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata
      };
    } catch (error) {
      logger.error('Error getting file metadata', { error, key });
      throw new AppError('Failed to get file metadata', 500);
    }
  }

  /**
   * Extract key from S3 URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      // Handle different S3 URL formats
      const patterns = [
        new RegExp(`https://${this.bucket}\\.s3\\.[^/]+/(.+)`),
        new RegExp(`https://s3\\.[^/]+/${this.bucket}/(.+)`),
        new RegExp(`https://[^/]+/${this.bucket}/(.+)`)
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }

      return null;
    } catch (error) {
      logger.error('Error extracting key from URL', { error, url });
      return null;
    }
  }

  /**
   * Generate public URL for a file
   */
  generatePublicUrl(key: string): string {
    try {
      // Use the base URL from config
      const baseUrl = config.CONTABO_BASE_URL || `https://${this.bucket}.s3.${config.CONTABO_REGION}.amazonaws.com`;
      return `${baseUrl}/${encodeURIComponent(key)}`;
    } catch (error) {
      logger.error('Error generating public URL', { error, key });
      throw new AppError('Failed to generate public URL', 500);
    }
  }
}

export default new S3Service();
