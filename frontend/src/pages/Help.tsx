import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import api from '../services/api'
import { toast } from 'react-hot-toast'

const faqData = [
  {
    question: 'How do I contact support?',
    answer:
      'Use the contact card below to email our support team or submit a feedback report directly from this page. We aim to respond within 24 hours.',
  },
  {
    question: 'How do I report a suspicious listing or user?',
    answer:
      'Choose the Report Issue section, select the issue category, and describe what happened. Our team reviews every report carefully.',
  },
  {
    question: 'Can I submit feedback about the app?',
    answer:
      'Yes. The Share Feedback section is built to capture any ideas, bugs, or improvement requests you want the BachelorHub team to review.',
  },
  {
    question: 'What safety advice should I follow?',
    answer:
      'Review the Safety Tips section for best practices when meeting sellers, booking accommodations, and handling payments online.',
  },
]

const safetyTips = [
  'Meet in a public place whenever possible and bring a friend or roommate with you.',
  'Never share sensitive personal details unless you fully trust the other party.',
  'Use secure payment methods and avoid sending money before verifying the listing or service.',
  'Verify the identity of a homechef or listing owner through their profile and past reviews.',
]

const communityGuidelines = [
  'Be respectful to other users and maintain a helpful tone in all messages.',
  'Share accurate details and photos for every listing or used item post.',
  'Avoid misrepresenting the condition, location, or availability of your service or product.',
  'Report behavior that violates the platform rules, such as fraud, harassment, or false information.',
]

const Help = () => {
  const [reportForm, setReportForm] = useState({
    name: '',
    email: '',
    issueType: 'listing_issue',
    description: '',
    relatedUrl: '',
  })
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    rating: '5',
    message: '',
  })
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const handleReportChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setReportForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFeedbackChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFeedbackForm((prev) => ({ ...prev, [name]: value }))
  }

  const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reportForm.email || !reportForm.description) {
      toast.error('Please provide your email and a report description.')
      return
    }

    try {
      setIsSubmittingReport(true)
      await api.post('/api/support/report', reportForm)
      toast.success('Your report has been submitted successfully.')
      setReportForm({
        name: '',
        email: '',
        issueType: 'listing_issue',
        description: '',
        relatedUrl: '',
      })
    } catch (error) {
      console.error('Report submission failed', error)
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!feedbackForm.email || !feedbackForm.message) {
      toast.error('Please provide your email and feedback message.')
      return
    }

    try {
      setIsSubmittingFeedback(true)
      await api.post('/api/support/feedback', feedbackForm)
      toast.success('Thank you! Your feedback has been sent.')
      setFeedbackForm({
        name: '',
        email: '',
        rating: '5',
        message: '',
      })
    } catch (error) {
      console.error('Feedback submission failed', error)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid gap-8 md:grid-cols-[2fr_1fr] items-start">
        <section className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-3">Help & Support</h1>
            <p className="text-gray-600 dark:text-gray-300 leading-8">
              Find answers, report issues, and reach our support team from one place. We are here to help you stay safe and get the most out of BachelorHub.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqData.map((item) => (
                <details key={item.question} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <summary className="cursor-pointer text-lg font-medium text-gray-900 dark:text-white">{item.question}</summary>
                  <p className="mt-3 text-gray-600 dark:text-gray-300 leading-7">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Safety Tips</h2>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 leading-7 list-inside list-disc">
                {safetyTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Community Guidelines</h2>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 leading-7 list-inside list-disc">
                {communityGuidelines.map((guideline) => (
                  <li key={guideline}>{guideline}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Support</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-7 mb-4">
              If you have any urgent questions or need direct help, email our support team or use the report form.
            </p>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Email: <a href="mailto:supportbachelorhub@gmail.com" className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">supportbachelorhub@gmail.com</a>
              </p>
              
              <p>Response time: typically within 24 hours.</p>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Report an Issue</h2>
            <form className="space-y-4" onSubmit={submitReport}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                <input
                  type="text"
                  name="name"
                  value={reportForm.name}
                  onChange={handleReportChange}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  name="email"
                  value={reportForm.email}
                  onChange={handleReportChange}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Issue Type</label>
                <select
                  name="issueType"
                  value={reportForm.issueType}
                  onChange={handleReportChange}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                >
                  <option value="listing_issue">Listing issue</option>
                  <option value="user_behavior">User behavior</option>
                  <option value="service_quality">Service quality</option>
                  <option value="payment_problem">Payment problem</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Related URL (optional)</label>
                <input
                  type="url"
                  name="relatedUrl"
                  value={reportForm.relatedUrl}
                  onChange={handleReportChange}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                <textarea
                  name="description"
                  value={reportForm.description}
                  onChange={handleReportChange}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                  placeholder="Describe the issue in detail"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmittingReport}>
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Share Feedback</h2>
            <form className="space-y-4" onSubmit={submitFeedback}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                <input
                  type="text"
                  name="name"
                  value={feedbackForm.name}
                  onChange={handleFeedbackChange}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  name="email"
                  value={feedbackForm.email}
                  onChange={handleFeedbackChange}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Rating</label>
                <select
                  name="rating"
                  value={feedbackForm.rating}
                  onChange={handleFeedbackChange}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Needs improvement</option>
                  <option value="1">1 - Poor experience</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Message</label>
                <textarea
                  name="message"
                  value={feedbackForm.message}
                  onChange={handleFeedbackChange}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900/30"
                  placeholder="Share your ideas, suggestions, or issues"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmittingFeedback}>
                {isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
              </Button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Help
