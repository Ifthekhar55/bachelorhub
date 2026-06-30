import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Prisma } from '@prisma/client';
import nodemailer from 'nodemailer';
import { prisma } from '../prisma';

const router = Router();
import { authenticate } from '../middleware/auth.middleware';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

const otpStore = new Map<string, {
  otpCode: string;
  expiresAt: Date;
  resendAvailableAt: Date;
  userId: string;
}>();

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5003}`
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''

const createOrFindSocialUser = async (email: string, name: string, provider: string) => {
  if (!email) {
    throw new Error('Email is required for social login')
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return existingUser
  }

  const randomPassword = crypto.randomBytes(16).toString('hex')
  const hashedPassword = await bcrypt.hash(randomPassword, 10)

  return prisma.user.create({
    data: {
      name,
      email,
      phone: '',
      password: hashedPassword,
      isVerified: true,
    },
  })
}

const configurePassport = () => {
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value
            const name = [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ').trim() || profile.displayName || 'Google User'
            const user = await createOrFindSocialUser(email ?? '', name, 'google')
            done(null, user)
          } catch (err) {
            done(err as Error)
          }
        }
      )
    )
  }

  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_APP_ID,
          clientSecret: FACEBOOK_APP_SECRET,
          callbackURL: `${BACKEND_URL}/api/auth/facebook/callback`,
          profileFields: ['id', 'displayName', 'emails', 'name'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value
            const name = profile.displayName || [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ').trim() || 'Facebook User'
            const user = await createOrFindSocialUser(email ?? '', name, 'facebook')
            done(null, user)
          } catch (err) {
            done(err as Error)
          }
        }
      )
    )
  }
}

configurePassport()

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = (smtpHost && smtpPort && smtpUser && smtpPass)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

const generateOtp = () => {
  return Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1)).toString();
};

const sendOtpMessage = async (email: string, otp: string) => {
  const subject = 'BachelorHub verification code';
  const text = `Your BachelorHub verification code is ${otp}. It expires in 5 minutes.`;

  if (transporter) {
    await transporter.sendMail({
      from: smtpUser,
      to: email,
      subject,
      text,
    });
    return;
  }

  // Fallback logging for development if SMTP is not configured
  console.log(`OTP for ${email}: ${otp}`);
};

const queueOtpForEmail = async (email: string, userId: string) => {
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const resendAvailableAt = new Date(Date.now() + RESEND_COOLDOWN_MS);

  otpStore.set(email, { otpCode, expiresAt, resendAvailableAt, userId });
  await sendOtpMessage(email, otpCode);

  return { otpCode, expiresAt, resendAvailableAt };
};

// Test registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email or phone is already in use' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    await queueOtpForEmail(email, user.id);

    res.status(201).json({ message: 'User created, OTP sent', email: user.email });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Email or phone is already in use' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// OTP verification
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const otpEntry = otpStore.get(email);
    if (!otpEntry) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    if (otpEntry.expiresAt < new Date()) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (otpEntry.otpCode !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    otpStore.delete(email);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (existingUser.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const existingOtp = otpStore.get(email);
    const now = new Date();
    if (existingOtp && existingOtp.resendAvailableAt > now) {
      const secondsLeft = Math.ceil((existingOtp.resendAvailableAt.getTime() - now.getTime()) / 1000);
      return res.status(429).json({ error: `Please wait ${secondsLeft} seconds before requesting a new OTP.` });
    }

    await queueOtpForEmail(email, existingUser.id);
    res.json({ message: 'OTP resent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Unable to resend OTP' });
  }
});

// Google social login start
router.get('/google', (req, res, next) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google login is not configured on the server' })
  }
  next()
}, passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback', (req, res, next) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`)
  }
  next()
}, passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }), (req, res) => {
  const user = req.user as any
  if (!user?.id) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_failed`)
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  )

  res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`)
})

// Facebook social login start
router.get('/facebook', (req, res, next) => {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return res.status(500).json({ error: 'Facebook login is not configured on the server' })
  }
  next()
}, passport.authenticate('facebook', { scope: ['email'] }))

router.get('/facebook/callback', (req, res, next) => {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return res.redirect(`${FRONTEND_URL}/login?error=facebook_not_configured`)
  }
  next()
}, passport.authenticate('facebook', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=facebook_failed` }), (req, res) => {
  const user = req.user as any
  if (!user?.id) {
    return res.redirect(`${FRONTEND_URL}/login?error=facebook_failed`)
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  )

  res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`)
})

// Test login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );
    
    // Return accessToken for frontend compatibility
    res.json({ accessToken: token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout (stateless token-based APIs can still accept logout for client convenience)
router.post('/logout', async (req, res) => {
  try {
    // If using server-side session store, clear it here. For JWT stateless tokens,
    // client should remove the token. We still return success so frontend can call.
    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Protected route to get current authenticated user's info
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, profilePhoto: true },
    });

    res.json(user);
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Failed to get authenticated user' });
  }
});

// Development endpoint to retrieve OTP for testing
router.get('/dev/otp/:email', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  const { email } = req.params;
  const otpEntry = otpStore.get(email);
  
  if (!otpEntry) {
    return res.status(404).json({ error: 'No OTP found for this email' });
  }
  
  res.json({ otp: otpEntry.otpCode, expiresAt: otpEntry.expiresAt });
});

export default router;