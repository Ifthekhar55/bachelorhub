import { Request, Response } from 'express'
import nodemailer from 'nodemailer'
import { prisma } from '../prisma'

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
const smtpUser = process.env.SMTP_USER
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '')
const supportEmail = process.env.SUPPORT_EMAIL || 'supportbachelorhub@gmail.com'

const transporter = smtpHost && smtpPort && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null

const sendSupportEmail = async (subject: string, html: string, text: string) => {
  if (!transporter || !smtpUser) {
    console.warn('SMTP not configured. Support email was not sent.')
    return false
  }

  try {
    await transporter.sendMail({
      from: smtpUser,
      to: supportEmail,
      subject,
      text,
      html,
    })
    return true
  } catch (error) {
    console.error('Failed to send support email:', error)
    return false
  }
}

class SupportController {
  submitReport = async (req: Request, res: Response) => {
    try {
      const { name, email, issueType, description, relatedUrl } = req.body
      console.log('Support report received:', { name, email, issueType, description, relatedUrl })

      const report = await prisma.supportReport.create({
        data: {
          name: name || null,
          email,
          issueType: issueType || null,
          description,
          relatedUrl: relatedUrl || null,
        },
      })

      const emailSent = await sendSupportEmail(
        `New support report from ${name || email}`,
        `
          <h3>New Support Report</h3>
          <p><strong>Name:</strong> ${name || 'N/A'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Issue Type:</strong> ${issueType || 'N/A'}</p>
          <p><strong>Related URL:</strong> ${relatedUrl || 'N/A'}</p>
          <p><strong>Description:</strong></p>
          <p>${description}</p>
        `,
        `New support report from ${name || email}\nEmail: ${email}\nIssue Type: ${issueType || 'N/A'}\nRelated URL: ${relatedUrl || 'N/A'}\nDescription: ${description}`,
      )

      res.json({
        message: emailSent ? 'Report submitted successfully' : 'Report saved successfully, but email delivery failed',
        id: report.id,
        emailSent,
      })
    } catch (error) {
      console.error('Submit report failed:', error)
      res.status(500).json({ error: 'Failed to submit report' })
    }
  }

  submitFeedback = async (req: Request, res: Response) => {
    try {
      const { name, email, rating, message } = req.body
      console.log('Support feedback received:', { name, email, rating, message })

      const feedback = await prisma.supportFeedback.create({
        data: {
          name: name || null,
          email,
          rating: rating || null,
          message,
        },
      })

      const emailSent = await sendSupportEmail(
        `New feedback from ${name || email}`,
        `
          <h3>New Support Feedback</h3>
          <p><strong>Name:</strong> ${name || 'N/A'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Rating:</strong> ${rating || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
        `New support feedback from ${name || email}\nEmail: ${email}\nRating: ${rating || 'N/A'}\nMessage: ${message}`,
      )

      res.json({
        message: emailSent ? 'Feedback sent successfully' : 'Feedback saved successfully, but email delivery failed',
        id: feedback.id,
        emailSent,
      })
    } catch (error) {
      console.error('Submit feedback failed:', error)
      res.status(500).json({ error: 'Failed to send feedback' })
    }
  }
}

export const supportController = new SupportController()
