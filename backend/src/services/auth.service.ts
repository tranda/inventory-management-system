// Auth Service - Constitution Art. 5.1: JWT authentication
// Business logic for authentication operations

import bcrypt from 'bcrypt';
import { prisma } from '../app.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type AuthenticatedUser,
} from '../middleware/auth.middleware.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../middleware/error.middleware.js';

// =============================================================================
// Types
// =============================================================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'MANAGER' | 'VIEWER';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: AuthenticatedUser;
  tokens: TokenPair;
}

// =============================================================================
// Login
// =============================================================================

export async function login(input: LoginInput): Promise<LoginResult> {
  const { email, password } = input;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Create authenticated user object
  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as 'ADMIN' | 'MANAGER' | 'VIEWER',
    isActive: user.isActive,
  };

  // Generate tokens
  const tokens: TokenPair = {
    accessToken: generateAccessToken(authenticatedUser),
    refreshToken: generateRefreshToken(user.id),
  };

  return { user: authenticatedUser, tokens };
}

// =============================================================================
// Register
// =============================================================================

export async function register(input: RegisterInput): Promise<AuthenticatedUser> {
  const { email, password, firstName, lastName, role = 'VIEWER' } = input;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new BadRequestError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as 'ADMIN' | 'MANAGER' | 'VIEWER',
    isActive: user.isActive,
  };
}

// =============================================================================
// Refresh Token
// =============================================================================

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Create authenticated user object
  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as 'ADMIN' | 'MANAGER' | 'VIEWER',
    isActive: user.isActive,
  };

  // Generate new tokens
  return {
    accessToken: generateAccessToken(authenticatedUser),
    refreshToken: generateRefreshToken(user.id),
  };
}

// =============================================================================
// Change Password
// =============================================================================

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get current password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
}

// =============================================================================
// Reset Password (Admin)
// =============================================================================

export async function resetPassword(userId: string, newPassword: string): Promise<void> {
  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
}

// =============================================================================
// Get User by ID
// =============================================================================

export async function getUserById(userId: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as 'ADMIN' | 'MANAGER' | 'VIEWER',
    isActive: user.isActive,
  };
}
