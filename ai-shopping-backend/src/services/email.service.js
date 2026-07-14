import sgMail from '@sendgrid/mail';
import config from '../config/env.js';

if (config.SENDGRID_API_KEY) {
  sgMail.setApiKey(config.SENDGRID_API_KEY);
}

/**
 * Send a welcome email to a newly registered user.
 * Fire-and-forget: logs errors, never throws.
 * @param {Object} user - { name, email }
 */
export const sendWelcomeEmail = async (user) => {
  if (!config.SENDGRID_API_KEY) {
    console.warn('[Email Service] SendGrid API key not configured. Skipping welcome email.');
    return;
  }

  try {
    const msg = {
      to: user.email,
      from: config.FROM_EMAIL,
      subject: 'Welcome to Your AI Shopping Assistant! 🛍️',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f6f8;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Welcome to Your AI Shopping Assistant</h1>
          </div>
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #333;">Hi ${user.name}! 👋</h2>
            <p style="color: #555; line-height: 1.6;">
              We're thrilled to have you on board. AI Shopping Assistant uses cutting-edge artificial intelligence to help you find the best products at the best prices.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.FRONTEND_URL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Start Browsing
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">Happy shopping! — The SmartShop AI Team</p>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    console.log(`[Email Service] Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send welcome email to ${user.email}: ${error.message}`);
  }
};

/**
 * Send a price drop alert email to a user.
 * Fire-and-forget: logs errors, never throws.
 * @param {Object} user - { name, email }
 * @param {Object} product - { _id, name, currentPrice }
 * @param {number} oldPrice
 * @param {number} newPrice
 */
export const sendPriceDropAlert = async (user, product, oldPrice, newPrice) => {
  if (!config.SENDGRID_API_KEY) {
    console.warn('[Email Service] SendGrid API key not configured. Skipping price drop alert.');
    return;
  }

  try {
    const savings = (oldPrice - newPrice).toFixed(2);
    const percentOff = (((oldPrice - newPrice) / oldPrice) * 100).toFixed(0);
    const productUrl = `${config.FRONTEND_URL}/product/${product._id}`;

    const msg = {
      to: user.email,
      from: config.FROM_EMAIL,
      subject: `Price Drop Alert: ${product.name} is now $${newPrice}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f6f8;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Price Drop Alert! 📉</h1>
          </div>
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #333;">Hi ${user.name},</h2>
            <p style="color: #555; line-height: 1.6;">
              Great news! A product on your wishlist just dropped in price.
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">${product.name}</h3>
              <p style="margin: 5px 0;">
                <span style="color: #999; text-decoration: line-through; font-size: 18px;">$${oldPrice}</span>
                <span style="color: #27ae60; font-size: 24px; font-weight: bold; margin-left: 10px;">$${newPrice}</span>
              </p>
              <p style="color: #27ae60; font-weight: bold;">You save $${savings} (${percentOff}% off)</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${productUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                View Product
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">— SmartShop AI</p>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    console.log(`[Email Service] Price drop alert sent to ${user.email} for product ${product._id}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send price drop alert: ${error.message}`);
  }
};

/**
 * Send a newsletter subscription confirmation email.
 * Fire-and-forget: logs errors, never throws.
 * @param {string} email
 */
export const sendNewsletterConfirmation = async (email) => {
  if (!config.SENDGRID_API_KEY) {
    console.warn('[Email Service] SendGrid API key not configured. Skipping newsletter confirmation.');
    return;
  }

  try {
    const msg = {
      to: email,
      from: config.FROM_EMAIL,
      subject: 'You\'re subscribed to SmartShop AI Newsletter!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f6f8;">
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0;">You're In! 🎉</h1>
          </div>
          <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="color: #555; line-height: 1.6;">
              You've been successfully subscribed to the SmartShop AI newsletter. You'll receive curated deals, product recommendations, and market insights directly in your inbox.
            </p>
            <p style="color: #888; font-size: 13px;">— SmartShop AI Team</p>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    console.log(`[Email Service] Newsletter confirmation sent to ${email}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send newsletter confirmation to ${email}: ${error.message}`);
  }
};

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (user, verificationToken) => {
  if (!config.SENDGRID_API_KEY) {
    console.warn('[Email Service] SendGrid not configured. Skipping verification email.')
    console.log(`[DEV] Email verification token for ${user.email}: ${verificationToken}`)
    return
  }
  try {
    const verifyUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}`
    const msg = {
      to: user.email,
      from: config.FROM_EMAIL,
      subject: 'Verify your SmartShop AI email address',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f4f6f8;">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;">Verify Your Email</h1>
          </div>
          <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
            <h2 style="color:#333;">Hi ${user.name}!</h2>
            <p style="color:#555;line-height:1.6;">Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${verifyUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color:#888;font-size:13px;">If you did not create an account, you can safely ignore this email.</p>
            <p style="color:#bbb;font-size:12px;word-break:break-all;">Or copy this link: ${verifyUrl}</p>
          </div>
        </body>
        </html>
      `,
    }
    await sgMail.send(msg)
    console.log(`[Email Service] Verification email sent to ${user.email}`)
  } catch (error) {
    console.error(`[Email Service] Failed to send verification email: ${error.message}`)
  }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  if (!config.SENDGRID_API_KEY) {
    console.warn('[Email Service] SendGrid not configured. Skipping reset email.')
    console.log(`[DEV] Password reset token for ${user.email}: ${resetToken}`)
    return
  }
  try {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`
    const msg = {
      to: user.email,
      from: config.FROM_EMAIL,
      subject: 'Reset your SmartShop AI password',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f4f6f8;">
          <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;">Reset Password</h1>
          </div>
          <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
            <h2 style="color:#333;">Hi ${user.name}!</h2>
            <p style="color:#555;line-height:1.6;">You requested a password reset. Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${resetUrl}" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color:#888;font-size:13px;">If you did not request this, ignore this email. Your password will not change.</p>
          </div>
        </body>
        </html>
      `,
    }
    await sgMail.send(msg)
    console.log(`[Email Service] Password reset email sent to ${user.email}`)
  } catch (error) {
    console.error(`[Email Service] Failed to send password reset email: ${error.message}`)
  }
}

