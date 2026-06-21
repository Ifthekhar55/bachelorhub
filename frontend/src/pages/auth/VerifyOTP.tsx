import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Smartphone, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-hot-toast'

const VerifyOTP = () => {
  const navigate = useNavigate()
  const { verifyOTP, resendOTP, isLoading } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const [email, setEmail] = useState(() => sessionStorage.getItem('pendingEmail') || '')

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  useEffect(() => {
    if (!email) {
      toast.error('Missing email. Please register first.')
      navigate('/register')
      return
    }
  }, [email, navigate])

  useEffect(() => {
    if (!resendTimer) return
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      toast.error('Please enter 6-digit OTP')
      return
    }
    try {
      if (!email) {
        throw new Error('Missing email')
      }
      await verifyOTP(email, otpCode)
      sessionStorage.removeItem('pendingEmail')
      toast.success('Email verified successfully!')
      navigate('/profile')
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Invalid OTP. Please try again.'
      toast.error(message)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Missing email. Please register first.')
      return
    }

    try {
      await resendOTP(email)
      setResendTimer(60)
      toast.success('OTP resent to your email')
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Unable to resend OTP right now.'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">Verify Your Email Address</h1>
          <p className="text-gray-500 mt-2">
            We've sent a 6-digit verification code to your email
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
            {isLoading ? 'Verifying...' : 'Verify OTP'}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || isLoading}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyOTP