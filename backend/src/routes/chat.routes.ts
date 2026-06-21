import express from 'express'
import { uploadSingle } from '../middleware/upload.middleware'
import { cloudinaryService } from '../services/cloudinary.service'

const router = express.Router()

// Upload a single chat attachment (image/file) and return the hosted URL
router.post('/upload', uploadSingle, async (req, res) => {
  try {
    const file = (req as any).file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const url = await cloudinaryService.uploadImage(file, 'chat-attachments')
    return res.json({ url })
  } catch (error) {
    console.error('Chat upload failed:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
})

export default router
