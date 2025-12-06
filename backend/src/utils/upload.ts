// Photo Upload Utility - User Story 1
// Handles file uploads with Multer and thumbnail generation with Sharp

import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { BadRequestError } from '../middleware/error.middleware.js';

// =============================================================================
// Configuration
// =============================================================================

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const PHOTOS_DIR = path.join(UPLOAD_DIR, 'photos');
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, 'thumbnails');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const THUMBNAIL_SIZE = 200;

// =============================================================================
// Ensure directories exist
// =============================================================================

async function ensureDirectories(): Promise<void> {
  await fs.mkdir(PHOTOS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
}

// Initialize directories
ensureDirectories().catch(console.error);

// =============================================================================
// Multer Configuration
// =============================================================================

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// =============================================================================
// Image Processing
// =============================================================================

export interface ProcessedImage {
  photoUrl: string;
  thumbnailUrl: string;
}

/**
 * Process uploaded image: optimize and create thumbnail
 */
export async function processImage(file: Express.Multer.File): Promise<ProcessedImage> {
  await ensureDirectories();

  const fileId = uuid();
  const extension = getExtension(file.mimetype);
  const photoFilename = `${fileId}.${extension}`;
  const thumbnailFilename = `${fileId}_thumb.${extension}`;

  const photoPath = path.join(PHOTOS_DIR, photoFilename);
  const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

  // Process main image (resize if too large, optimize)
  await sharp(file.buffer)
    .resize(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toFile(photoPath);

  // Generate thumbnail
  await sharp(file.buffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  return {
    photoUrl: `/uploads/photos/${photoFilename}`,
    thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
  };
}

/**
 * Delete an image and its thumbnail
 */
export async function deleteImage(photoUrl: string, thumbnailUrl: string): Promise<void> {
  try {
    const photoPath = path.join(process.cwd(), photoUrl);
    const thumbnailPath = path.join(process.cwd(), thumbnailUrl);

    await fs.unlink(photoPath).catch(() => {});
    await fs.unlink(thumbnailPath).catch(() => {});
  } catch {
    // Ignore errors when deleting files
  }
}

// =============================================================================
// Helpers
// =============================================================================

function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return extensions[mimeType] || 'jpg';
}

/**
 * Validate file size
 */
export function validateFileSize(file: Express.Multer.File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
}

/**
 * Validate file type
 */
export function validateFileType(file: Express.Multer.File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
}
