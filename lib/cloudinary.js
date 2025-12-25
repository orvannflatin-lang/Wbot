import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from 'stream';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a stream to Cloudinary
 * @param {Buffer | Stream} bufferOrStream 
 * @param {string} folder 
 * @returns {Promise<any>}
 */
export const uploadToCloudinary = (bufferOrStream, folder = 'wbot_media') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    if (Buffer.isBuffer(bufferOrStream)) {
        const stream = new PassThrough();
        stream.end(bufferOrStream);
        stream.pipe(uploadStream);
    } else {
        bufferOrStream.pipe(uploadStream);
    }
  });
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("Cloudinary delete error:", err);
        return null;
    }
};
