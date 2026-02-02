import bcrypt from 'bcryptjs';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailToken,
  verifyRefreshToken,
  revokeAllUserTokens,
} from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, SMTP_CONFIGURED } from '../utils/email';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'educator' | 'student';
}

interface LoginInput {
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

export const register = async (input: RegisterInput): Promise<{ user: User }> => {
  const { name, email, password, role } = input;

  // Check if email already exists
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Auto-verify if SMTP is not configured (development mode)
  const autoVerify = !SMTP_CONFIGURED;

  // Generate verification token (only needed if SMTP is configured)
  const verificationToken = autoVerify ? null : generateEmailToken();
  const verificationExpires = autoVerify ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Create user
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role, email_verified, email_verification_token, email_verification_expires)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, email_verified`,
    [name, email, passwordHash, role, autoVerify, verificationToken, verificationExpires]
  );

  const user = {
    id: result.rows[0].id,
    name: result.rows[0].name,
    email: result.rows[0].email,
    role: result.rows[0].role,
    emailVerified: result.rows[0].email_verified,
  };

  // Send verification email only if SMTP is configured
  if (!autoVerify && verificationToken) {
    await sendVerificationEmail(email, name, verificationToken);
  } else {
    console.log(`[DEV] User ${email} auto-verified (SMTP not configured)`);
  }

  return { user };
};

export const login = async (
  input: LoginInput
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const { email, password } = input;

  // Find user
  const result = await db.query(
    'SELECT id, name, email, password_hash, role, email_verified FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const dbUser = result.rows[0];

  // Check password
  const validPassword = await bcrypt.compare(password, dbUser.password_hash);
  if (!validPassword) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check email verification
  if (!dbUser.email_verified) {
    throw new AppError('Please verify your email before logging in', 401, 'EMAIL_NOT_VERIFIED');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
  });
  const refreshToken = await generateRefreshToken(dbUser.id);

  const user = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    emailVerified: dbUser.email_verified,
  };

  return { user, accessToken, refreshToken };
};

export const verifyEmail = async (token: string): Promise<void> => {
  const result = await db.query(
    `UPDATE users
     SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL
     WHERE email_verification_token = $1 AND email_verification_expires > NOW()
     RETURNING id`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired verification link', 400, 'INVALID_TOKEN');
  }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  // Always return success to prevent email enumeration
  const result = await db.query('SELECT id, name FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    return; // Don't reveal if email exists
  }

  const user = result.rows[0];
  const resetToken = generateEmailToken();
  const resetExpires = new Date();
  resetExpires.setHours(resetExpires.getHours() + 1);

  await db.query(
    `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
    [resetToken, resetExpires, user.id]
  );

  await sendPasswordResetEmail(email, user.name, resetToken);
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const result = await db.query(
    `SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired reset link', 400, 'INVALID_TOKEN');
  }

  const userId = result.rows[0].id;
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await db.query(
    `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2`,
    [passwordHash, userId]
  );

  // Revoke all existing sessions
  await revokeAllUserTokens(userId);
};

export const refreshAccessToken = async (
  refreshToken: string,
  userId: string
): Promise<{ accessToken: string }> => {
  const valid = await verifyRefreshToken(refreshToken, userId);

  if (!valid) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const user = result.rows[0];
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken };
};

export const getUser = async (userId: string): Promise<User> => {
  const result = await db.query(
    'SELECT id, name, email, role, email_verified FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    email: result.rows[0].email,
    role: result.rows[0].role,
    emailVerified: result.rows[0].email_verified,
  };
};
