import emailjs from '@emailjs/browser';

// EmailJS configuration
// Get these from https://dashboard.emailjs.com/
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// Generate 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (
  email: string,
  code: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> => {
  const trimmedEmail = (email || '').trim();
  if (!trimmedEmail) {
    return { success: false, error: 'Recipient email is empty' };
  }
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    return {
      success: false,
      error: 'EmailJS not configured. Please add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY to .env',
    };
  }

  try {
    const templateParams = {
      // Template uses {{email}} in "To Email" field
      email: trimmedEmail,
      to_email: trimmedEmail, // Backup in case template changes
      reply_to: trimmedEmail,
      to_name: userName || trimmedEmail.split('@')[0],
      passcode: code, // Your template uses {{passcode}}
      verification_code: code, // Backup
      time: '15 minutes', // For {{time}} variable
      app_name: 'Expense Tracker',
      company_name: 'Expense Tracker',
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (result.status !== 200) {
      return { success: false, error: `EmailJS responded with status ${result.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('EmailJS error:', error);
    return {
      success: false,
      error: error.text || 'Failed to send verification email',
    };
  }
};

// Store verification code temporarily (expires in 10 minutes)
interface VerificationData {
  code: string;
  email: string;
  expiresAt: number;
}

const VERIFICATION_STORAGE_KEY = 'email_verification';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const storeVerificationCode = (email: string, code: string): void => {
  const data: VerificationData = {
    code,
    email,
    expiresAt: Date.now() + CODE_EXPIRY_MS,
  };
  localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(data));
};

export const verifyCode = (email: string, code: string): { valid: boolean; error?: string } => {
  const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
  if (!stored) {
    return { valid: false, error: 'No verification code found. Please request a new one.' };
  }

  try {
    const data: VerificationData = JSON.parse(stored);

    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(VERIFICATION_STORAGE_KEY);
      return { valid: false, error: 'Verification code expired. Please request a new one.' };
    }

    if (data.email !== email) {
      return { valid: false, error: 'Email mismatch.' };
    }

    if (data.code !== code) {
      return { valid: false, error: 'Invalid verification code.' };
    }

    // Clear the code after successful verification
    localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid verification data.' };
  }
};

export const clearVerificationCode = (): void => {
  localStorage.removeItem(VERIFICATION_STORAGE_KEY);
};
