import { Request, Response } from 'express'

class SupportController {
  submitReport = async (req: Request, res: Response) => {
    try {
      const { name, email, issueType, description, relatedUrl } = req.body
      console.log('Support report received:', { name, email, issueType, description, relatedUrl })

      // In a production implementation, this would store the report in a database or notify support staff.
      res.json({ message: 'Report submitted successfully' })
    } catch (error) {
      console.error('Submit report failed:', error)
      res.status(500).json({ error: 'Failed to submit report' })
    }
  }

  submitFeedback = async (req: Request, res: Response) => {
    try {
      const { name, email, rating, message } = req.body
      console.log('Support feedback received:', { name, email, rating, message })

      // In a production implementation, this would store the feedback in a database or notify product team.
      res.json({ message: 'Feedback sent successfully' })
    } catch (error) {
      console.error('Submit feedback failed:', error)
      res.status(500).json({ error: 'Failed to send feedback' })
    }
  }
}

export const supportController = new SupportController()
