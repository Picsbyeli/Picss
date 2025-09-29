import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// This would normally come from environment variables in a production app
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// For development, we'll use a test account
let testAccount: any = null;

// Create email transporter
async function createTransporter() {
  // If we don't have real credentials, use ethereal for testing
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  // Otherwise, use real credentials
  return nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

// Generate a verification token
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Generate token expiry (24 hours from now)
export function generateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string, username: string): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: EMAIL_USER || 'verification@burble-game.com',
      to: email,
      subject: 'Verify Your Burble Game Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome to Burble Brain Teasers!</h2>
          <p>Hi ${username},</p>
          <p>Thank you for registering for Burble Brain Teasers. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not register for Burble Brain Teasers, please ignore this email.</p>
          <p>Thanks,<br>The Burble Team</p>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log the test URL for development
    if (testAccount) {
      console.log('Verification email sent: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}