// Application Router - Constitution Art. 5.2: Role-based access control
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddItemPage } from './pages/inventory/AddItemPage';
import { AssignItemPage } from './pages/assignments/AssignItemPage';
import { ReturnItemPage } from './pages/assignments/ReturnItemPage';
import { TransferPage } from './pages/assignments/TransferPage';
import { InventoryListPage } from './pages/inventory/InventoryListPage';
import { ItemDetailPage } from './pages/inventory/ItemDetailPage';
import { EmployeeListPage } from './pages/employees/EmployeeListPage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';
import { AssignmentsListPage } from './pages/assignments/AssignmentsListPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';

// Lazy load pages for code splitting
// import { lazy } from 'react';
// const ItemsPage = lazy(() => import('./pages/ItemsPage'));
// const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
// etc.

// Placeholder pages (to be implemented)
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">This page is under construction.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'inventory',
        element: <InventoryListPage />,
      },
      {
        path: 'inventory/add',
        element: (
          <ProtectedRoute requiredRole="MANAGER">
            <AddItemPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/:id',
        element: <ItemDetailPage />,
      },
      {
        path: 'inventory/:id/edit',
        element: (
          <ProtectedRoute requiredRole="MANAGER">
            <PlaceholderPage title="Edit Item" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'employees',
        element: <EmployeeListPage />,
      },
      {
        path: 'employees/:id',
        element: <EmployeeDetailPage />,
      },
      {
        path: 'assignments',
        element: <AssignmentsListPage />,
      },
      {
        path: 'assignments/new',
        element: (
          <ProtectedRoute requiredRole="MANAGER">
            <AssignItemPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assignments/:id',
        element: <PlaceholderPage title="Assignment Details" />,
      },
      {
        path: 'assignments/:id/return',
        element: (
          <ProtectedRoute requiredRole="MANAGER">
            <ReturnItemPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assignments/:id/transfer',
        element: (
          <ProtectedRoute requiredRole="MANAGER">
            <TransferPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredRole="MANAGER">
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <PlaceholderPage title="Settings" />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
