import { Router } from 'express'
import { supportController } from '../controllers/support.controller'

const router = Router()

router.post('/report', supportController.submitReport)
router.post('/feedback', supportController.submitFeedback)

export default router
