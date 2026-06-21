import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  async uploadImage(file: any, folder: string): Promise<string> {
    try {
      let result;
      
      if (file.path) {
        // Upload from local file path
        result = await cloudinary.uploader.upload(file.path, {
          folder: `bachelor-housing/${folder}`,
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' }
          ],
        });
        // Delete temporary file after upload
        fs.unlinkSync(file.path);
      } 
      else if (file.buffer) {
        // Upload from buffer (memory)
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `bachelor-housing/${folder}`,
              transformation: [
                { width: 500, height: 500, crop: 'limit' },
                { quality: 'auto' }
              ],
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );
          uploadStream.end(file.buffer);
        });
      }
      
      return result?.secure_url || '';
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }
  }

  async uploadMultiple(files: any[], folder: string): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }
}

export const cloudinaryService = new CloudinaryService();