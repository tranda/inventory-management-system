// UserManagementPage - US12 User Access Control
// Admin-only page for managing system users

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Key,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { UserForm } from '../../components/forms/UserForm';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useActivateUser,
  useDeactivateUser,
  useResetPassword,
  USER_ROLES,
  type User,
  type UserRole,
  type UserCreateInput,
  type UserUpdateInput,
} from '../../services/users.service';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/utils';

// =============================================================================
// Component
// =============================================================================

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Filter states
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Parse query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const role = (searchParams.get('role') as UserRole) || undefined;
  const isActive = searchParams.get('isActive') === 'false' ? false : searchParams.get('isActive') === 'true' ? true : undefined;

  // Fetch users
  const { data, isLoading } = useUsers({
    page,
    limit: 20,
    search,
    role,
    isActive,
    sortBy: 'lastName',
    sortOrder: 'asc',
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetPassword();

  // Update URL params
  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    if (!updates.page) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleSearch = () => {
    updateParams({ search: searchInput || undefined });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const handleCreate = async (data: UserCreateInput | UserUpdateInput) => {
    try {
      await createUser.mutateAsync(data as UserCreateInput);
      setShowCreateModal(false);
      toast.success('User created', 'New user has been created successfully.');
    } catch (err) {
      toast.error('Failed to create user', err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdate = async (data: UserCreateInput | UserUpdateInput) => {
    if (!editingUser) return;
    try {
      await updateUser.mutateAsync({ id: editingUser.id, data: data as UserUpdateInput });
      setEditingUser(null);
      toast.success('User updated', 'User information has been updated.');
    } catch (err) {
      toast.error('Failed to update user', err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await deleteUser.mutateAsync(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
      toast.success('User deleted', 'User has been deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete user', err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleResetPassword = async () => {
    if (!showResetPassword || !newPassword) return;
    try {
      await resetPassword.mutateAsync({ id: showResetPassword.id, newPassword });
      setShowResetPassword(null);
      setNewPassword('');
      toast.success('Password reset', 'User password has been reset successfully.');
    } catch (err) {
      toast.error('Failed to reset password', err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      if (user.isActive) {
        await deactivateUser.mutateAsync(user.id);
        toast.success('User deactivated', `${user.firstName} ${user.lastName} has been deactivated.`);
      } else {
        await activateUser.mutateAsync(user.id);
        toast.success('User activated', `${user.firstName} ${user.lastName} has been activated.`);
      }
    } catch (err) {
      toast.error('Failed to update user status', err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive">Admin</Badge>;
      case 'MANAGER':
        return <Badge variant="info">Manager</Badge>;
      case 'VIEWER':
        return <Badge variant="secondary">Viewer</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Table columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </div>
          <div>
            <div className="font-medium">
              {user.firstName} {user.lastName}
              {user.id === currentUser?.id && (
                <span className="ml-2 text-xs text-muted-foreground">(You)</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'secondary'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: 'actions',
      header: '',
      render: (user) => {
        const isSelf = user.id === currentUser?.id;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingUser(user)}
              title="Edit user"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetPassword(user)}
              title="Reset password"
            >
              <Key className="h-4 w-4" />
            </Button>
            {!isSelf && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(user)}
                  title={user.isActive ? 'Deactivate user' : 'Activate user'}
                >
                  {user.isActive ? (
                    <UserX className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(user)}
                  title="Delete user"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Calculate summary stats
  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const managerCount = users.filter((u) => u.role === 'MANAGER').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their access permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{pagination?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Administrators</p>
              <p className="text-xl font-bold">{adminCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Managers</p>
              <p className="text-xl font-bold">{managerCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Search</label>
            <div className="mt-1 flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="w-40">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={role || ''}
              onChange={(e) => updateParams({ role: e.target.value || undefined })}
              className="mt-1"
            >
              <option value="">All Roles</option>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={isActive === undefined ? '' : isActive ? 'true' : 'false'}
              onChange={(e) => updateParams({ isActive: e.target.value || undefined })}
              className="mt-1"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              setSearchParams(new URLSearchParams());
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        keyField="id"
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <UserForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateModal(false)}
              isLoading={createUser.isPending}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <UserForm
              user={editingUser}
              onSubmit={handleUpdate}
              onCancel={() => setEditingUser(null)}
              isLoading={updateUser.isPending}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Reset Password</h3>
            <p className="mt-2 text-muted-foreground">
              Set a new password for {showResetPassword.firstName} {showResetPassword.lastName}
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="mt-1"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetPassword(null);
                  setNewPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                isLoading={resetPassword.isPending}
                disabled={newPassword.length < 8}
              >
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Delete User</h3>
            <p className="mt-2 text-muted-foreground">
              Are you sure you want to delete {showDeleteConfirm.firstName} {showDeleteConfirm.lastName}?
              This action cannot be undone.
            </p>
            <p className="mt-2 text-sm text-yellow-600">
              Note: Users with activity history cannot be deleted. Consider deactivating instead.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                isLoading={deleteUser.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
