import dotenv from 'dotenv';

dotenv.config();

const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

if (!process.env.GEMINI_API_KEY) {
  console.warn(' WARNING: GEMINI_API_KEY is not set. AI features will be unavailable.');
}

const config = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 3001,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@smartshopai.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MONTHLY_AFFILIATE_GOAL: parseInt(process.env.MONTHLY_AFFILIATE_GOAL, 10) || 50000,
  COMMISSION_RATE_DEFAULT: parseFloat(process.env.COMMISSION_RATE_DEFAULT) || 0.03,
});

export default config;
