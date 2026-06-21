require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testUpload() {
  try {
    // Test if credentials work (ping Cloudinary)
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!', result);
    
    // Test uploading a simple string (no actual image needed)
    console.log('Cloud name:', cloudinary.config().cloud_name);
    console.log('API Key exists:', !!cloudinary.config().api_key);
    
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
  }
}

testUpload();