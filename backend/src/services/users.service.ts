// Users Service - Constitution Art. 5.2: User management
// CRUD operations for user accounts (ADMIN only)

import bcrypt from 'bcrypt';
import { prisma } from '../app.js';
import { BadRequestError, NotFoundError, ConflictError } from '../middleware/error.middleware.js';

// =============================================================================
// Types
// =============================================================================

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface UserListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

// =============================================================================
// List Users
// =============================================================================

export async function listUsers(query: UserListQuery = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'lastName',
    sortOrder = 'asc',
    search,
    role,
    isActive,
  } = query;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Execute query
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// =============================================================================
// Get User by ID
// =============================================================================

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

// =============================================================================
// Create User
// =============================================================================

export async function createUser(input: CreateUserInput) {
  const { email, password, firstName, lastName, role } = input;

  // Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new ConflictError('Email already exists');
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// =============================================================================
// Update User
// =============================================================================

export async function updateUser(id: string, input: UpdateUserInput) {
  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!currentUser) {
    throw new NotFoundError('User');
  }

  // Check for duplicate email if changing
  if (input.email && input.email !== currentUser.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('Email already exists');
    }
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: input,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// =============================================================================
// Delete User
// =============================================================================

export async function deleteUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  await prisma.user.delete({
    where: { id },
  });
}

// =============================================================================
// Activate User
// =============================================================================

export async function activateUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.isActive) {
    throw new BadRequestError('User is already active');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

// =============================================================================
// Deactivate User
// =============================================================================

export async function deactivateUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (!user.isActive) {
    throw new BadRequestError('User is already deactivated');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

// =============================================================================
// Reset Password
// =============================================================================

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}
