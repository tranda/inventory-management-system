// UserForm - US12 User Management
// Form for creating and editing users

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { USER_ROLES, type User, type UserRole } from '../../services/users.service';

// =============================================================================
// Schema
// =============================================================================

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER'] as const),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER'] as const),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// =============================================================================
// Types
// =============================================================================

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserFormData | UpdateUserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  currentUserId?: string; // To prevent self-demotion
}

// =============================================================================
// Component
// =============================================================================

export function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  currentUserId,
}: UserFormProps) {
  const isEditing = !!user;
  const isSelf = user?.id === currentUserId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: user
      ? {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      : {
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'VIEWER' as UserRole,
        },
  });

  const selectedRole = watch('role');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="text-sm font-medium">
            First Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="John"
            className="mt-1"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="text-sm font-medium">
            Last Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Doe"
            className="mt-1"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email <span className="text-destructive">*</span>
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="john.doe@company.com"
          className="mt-1"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password - Only for new users */}
      {!isEditing && (
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password <span className="text-destructive">*</span>
          </label>
          <Input
            id="password"
            type="password"
            {...register('password' as keyof CreateUserFormData)}
            placeholder="Minimum 8 characters"
            className="mt-1"
          />
          {(errors as { password?: { message?: string } }).password && (
            <p className="mt-1 text-sm text-destructive">
              {(errors as { password?: { message?: string } }).password?.message}
            </p>
          )}
        </div>
      )}

      {/* Role */}
      <div>
        <label htmlFor="role" className="text-sm font-medium">
          Role <span className="text-destructive">*</span>
        </label>
        <Select
          id="role"
          {...register('role')}
          className="mt-1"
          disabled={isSelf && user?.role === 'ADMIN'} // Can't demote self from admin
        >
          {USER_ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </Select>
        {isSelf && user?.role === 'ADMIN' && (
          <p className="mt-1 text-sm text-muted-foreground">
            You cannot change your own admin role.
          </p>
        )}
        {errors.role && (
          <p className="mt-1 text-sm text-destructive">{errors.role.message}</p>
        )}

        {/* Role description */}
        <p className="mt-2 text-sm text-muted-foreground">
          {USER_ROLES.find((r) => r.value === selectedRole)?.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
