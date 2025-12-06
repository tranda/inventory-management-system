// IT Inventory Management System - Database Seed Script
// Creates initial data for development and testing

import { PrismaClient, UserRole, ItemCategory, ItemStatus, ItemCondition } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://inventory:inventory_dev@localhost:5432/inventory?schema=public';
const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // =============================================================================
  // USERS
  // =============================================================================

  console.log('Creating users...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);
  const viewerPassword = await bcrypt.hash('viewer123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      email: 'manager@company.com',
      passwordHash: managerPassword,
      firstName: 'Inventory',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@company.com' },
    update: {},
    create: {
      email: 'viewer@company.com',
      passwordHash: viewerPassword,
      firstName: 'Read',
      lastName: 'Only',
      role: UserRole.VIEWER,
    },
  });

  console.log(`Created users: ${admin.email}, ${manager.email}, ${viewer.email}`);

  // =============================================================================
  // EMPLOYEES
  // =============================================================================

  console.log('Creating employees...');

  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { email: 'john.doe@company.com' },
      update: {},
      create: {
        email: 'john.doe@company.com',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
        title: 'Senior Developer',
        phone: '+1-555-0101',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'jane.smith@company.com' },
      update: {},
      create: {
        email: 'jane.smith@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        department: 'Design',
        title: 'UX Designer',
        phone: '+1-555-0102',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'bob.wilson@company.com' },
      update: {},
      create: {
        email: 'bob.wilson@company.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        department: 'Engineering',
        title: 'DevOps Engineer',
        phone: '+1-555-0103',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'alice.johnson@company.com' },
      update: {},
      create: {
        email: 'alice.johnson@company.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        department: 'Marketing',
        title: 'Marketing Manager',
        phone: '+1-555-0104',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'charlie.brown@company.com' },
      update: {},
      create: {
        email: 'charlie.brown@company.com',
        firstName: 'Charlie',
        lastName: 'Brown',
        department: 'Sales',
        title: 'Sales Representative',
        phone: '+1-555-0105',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'diana.prince@company.com' },
      update: {},
      create: {
        email: 'diana.prince@company.com',
        firstName: 'Diana',
        lastName: 'Prince',
        department: 'HR',
        title: 'HR Manager',
        phone: '+1-555-0106',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'edward.stark@company.com' },
      update: {},
      create: {
        email: 'edward.stark@company.com',
        firstName: 'Edward',
        lastName: 'Stark',
        department: 'Finance',
        title: 'Financial Analyst',
        phone: '+1-555-0107',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'fiona.green@company.com' },
      update: {},
      create: {
        email: 'fiona.green@company.com',
        firstName: 'Fiona',
        lastName: 'Green',
        department: 'Engineering',
        title: 'QA Engineer',
        phone: '+1-555-0108',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'george.harris@company.com' },
      update: {},
      create: {
        email: 'george.harris@company.com',
        firstName: 'George',
        lastName: 'Harris',
        department: 'Product',
        title: 'Product Manager',
        phone: '+1-555-0109',
      },
    }),
    prisma.employee.upsert({
      where: { email: 'helen.troy@company.com' },
      update: {},
      create: {
        email: 'helen.troy@company.com',
        firstName: 'Helen',
        lastName: 'Troy',
        department: 'Design',
        title: 'Graphic Designer',
        phone: '+1-555-0110',
      },
    }),
  ]);

  console.log(`Created ${employees.length} employees`);

  // =============================================================================
  // ITEMS - LAPTOPS
  // =============================================================================

  console.log('Creating items...');

  const laptops = await Promise.all([
    prisma.item.upsert({
      where: { assetId: 'LT-2024-001' },
      update: {},
      create: {
        assetId: 'LT-2024-001',
        name: 'Dell Latitude 5540',
        category: ItemCategory.LAPTOP,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Dell',
        model: 'Latitude 5540',
        serialNumber: 'DL5540-001-ABC',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 1299.99,
        warrantyExpiration: new Date('2027-01-15'),
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'LT-2024-002' },
      update: {},
      create: {
        assetId: 'LT-2024-002',
        name: 'MacBook Pro 14"',
        category: ItemCategory.LAPTOP,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Apple',
        model: 'MacBook Pro 14-inch M3',
        serialNumber: 'MBP14-002-XYZ',
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 1999.99,
        warrantyExpiration: new Date('2027-02-01'),
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'LT-2024-003' },
      update: {},
      create: {
        assetId: 'LT-2024-003',
        name: 'ThinkPad X1 Carbon',
        category: ItemCategory.LAPTOP,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.GOOD,
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon Gen 11',
        serialNumber: 'TPX1C-003-DEF',
        purchaseDate: new Date('2023-06-15'),
        purchasePrice: 1549.99,
        warrantyExpiration: new Date('2026-06-15'),
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'LT-2024-004' },
      update: {},
      create: {
        assetId: 'LT-2024-004',
        name: 'HP EliteBook 840',
        category: ItemCategory.LAPTOP,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.GOOD,
        brand: 'HP',
        model: 'EliteBook 840 G9',
        serialNumber: 'HPEB840-004-GHI',
        purchaseDate: new Date('2023-08-20'),
        purchasePrice: 1399.99,
        warrantyExpiration: new Date('2026-08-20'),
        location: 'IT Storage Room B',
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'LT-2024-005' },
      update: {},
      create: {
        assetId: 'LT-2024-005',
        name: 'Dell XPS 15',
        category: ItemCategory.LAPTOP,
        status: ItemStatus.IN_REPAIR,
        condition: ItemCondition.NEEDS_REPAIR,
        brand: 'Dell',
        model: 'XPS 15 9530',
        serialNumber: 'DXPS15-005-JKL',
        purchaseDate: new Date('2023-03-10'),
        purchasePrice: 1799.99,
        warrantyExpiration: new Date('2026-03-10'),
        location: 'Repair Center',
        notes: 'Screen replacement needed',
        createdById: admin.id,
      },
    }),
  ]);

  console.log(`Created ${laptops.length} laptops`);

  // =============================================================================
  // ITEMS - MONITORS
  // =============================================================================

  const monitors = await Promise.all([
    prisma.item.upsert({
      where: { assetId: 'MN-2024-001' },
      update: {},
      create: {
        assetId: 'MN-2024-001',
        name: 'Dell UltraSharp 27"',
        category: ItemCategory.MONITOR,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Dell',
        model: 'U2722D',
        serialNumber: 'DU27-001-MNO',
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 449.99,
        warrantyExpiration: new Date('2027-01-20'),
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'MN-2024-002' },
      update: {},
      create: {
        assetId: 'MN-2024-002',
        name: 'LG 32" 4K Monitor',
        category: ItemCategory.MONITOR,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'LG',
        model: '32UN880-B',
        serialNumber: 'LG32-002-PQR',
        purchaseDate: new Date('2024-02-15'),
        purchasePrice: 699.99,
        warrantyExpiration: new Date('2027-02-15'),
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'MN-2024-003' },
      update: {},
      create: {
        assetId: 'MN-2024-003',
        name: 'Samsung 24" Monitor',
        category: ItemCategory.MONITOR,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.GOOD,
        brand: 'Samsung',
        model: 'S24R650',
        serialNumber: 'SS24-003-STU',
        purchaseDate: new Date('2023-05-10'),
        purchasePrice: 249.99,
        warrantyExpiration: new Date('2026-05-10'),
        location: 'IT Storage Room B',
        createdById: admin.id,
      },
    }),
  ]);

  console.log(`Created ${monitors.length} monitors`);

  // =============================================================================
  // ITEMS - KEYBOARDS & MICE (Consumables)
  // =============================================================================

  const keyboards = await Promise.all([
    prisma.item.upsert({
      where: { assetId: 'KB-2024-001' },
      update: {},
      create: {
        assetId: 'KB-2024-001',
        name: 'Logitech MX Keys',
        category: ItemCategory.KEYBOARD,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Logitech',
        model: 'MX Keys',
        serialNumber: 'LMXK-001-VWX',
        purchaseDate: new Date('2024-01-05'),
        purchasePrice: 99.99,
        location: 'IT Storage Room A',
        isConsumable: true,
        minStockLevel: 5,
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'KB-2024-002' },
      update: {},
      create: {
        assetId: 'KB-2024-002',
        name: 'Apple Magic Keyboard',
        category: ItemCategory.KEYBOARD,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Apple',
        model: 'Magic Keyboard',
        serialNumber: 'AMK-002-YZA',
        purchaseDate: new Date('2024-02-10'),
        purchasePrice: 129.99,
        location: 'IT Storage Room A',
        isConsumable: true,
        minStockLevel: 5,
        createdById: admin.id,
      },
    }),
  ]);

  const mice = await Promise.all([
    prisma.item.upsert({
      where: { assetId: 'MS-2024-001' },
      update: {},
      create: {
        assetId: 'MS-2024-001',
        name: 'Logitech MX Master 3',
        category: ItemCategory.MOUSE,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Logitech',
        model: 'MX Master 3',
        serialNumber: 'LMM3-001-BCD',
        purchaseDate: new Date('2024-01-05'),
        purchasePrice: 99.99,
        location: 'IT Storage Room A',
        isConsumable: true,
        minStockLevel: 10,
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'MS-2024-002' },
      update: {},
      create: {
        assetId: 'MS-2024-002',
        name: 'Apple Magic Mouse',
        category: ItemCategory.MOUSE,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Apple',
        model: 'Magic Mouse',
        serialNumber: 'AMM-002-EFG',
        purchaseDate: new Date('2024-02-10'),
        purchasePrice: 79.99,
        location: 'IT Storage Room A',
        isConsumable: true,
        minStockLevel: 10,
        createdById: admin.id,
      },
    }),
  ]);

  console.log(`Created ${keyboards.length} keyboards and ${mice.length} mice`);

  // =============================================================================
  // ITEMS - HEADSETS
  // =============================================================================

  const headsets = await Promise.all([
    prisma.item.upsert({
      where: { assetId: 'HS-2024-001' },
      update: {},
      create: {
        assetId: 'HS-2024-001',
        name: 'Jabra Evolve2 75',
        category: ItemCategory.HEADSET,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Jabra',
        model: 'Evolve2 75',
        serialNumber: 'JE75-001-HIJ',
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 349.99,
        location: 'IT Storage Room A',
        isConsumable: true,
        minStockLevel: 3,
        createdById: admin.id,
      },
    }),
    prisma.item.upsert({
      where: { assetId: 'HS-2024-002' },
      update: {},
      create: {
        assetId: 'HS-2024-002',
        name: 'Sony WH-1000XM5',
        category: ItemCategory.HEADSET,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Sony',
        model: 'WH-1000XM5',
        serialNumber: 'SWH5-002-KLM',
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 399.99,
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
  ]);

  console.log(`Created ${headsets.length} headsets`);

  // =============================================================================
  // ITEMS - PHONES & TABLETS
  // =============================================================================

  const phones = await Promise.all([
    prisma.item.upsert({
      where: { assetId: 'PH-2024-001' },
      update: {},
      create: {
        assetId: 'PH-2024-001',
        name: 'iPhone 15 Pro',
        category: ItemCategory.PHONE,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        serialNumber: 'IP15P-001-NOP',
        purchaseDate: new Date('2024-01-10'),
        purchasePrice: 999.99,
        warrantyExpiration: new Date('2026-01-10'),
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
  ]);

  const tablets = await Promise.all([
    prisma.item.upsert({
      where: { assetId: 'TB-2024-001' },
      update: {},
      create: {
        assetId: 'TB-2024-001',
        name: 'iPad Pro 12.9"',
        category: ItemCategory.TABLET,
        status: ItemStatus.AVAILABLE,
        condition: ItemCondition.NEW,
        brand: 'Apple',
        model: 'iPad Pro 12.9-inch M2',
        serialNumber: 'IPPRO-001-QRS',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 1099.99,
        warrantyExpiration: new Date('2026-01-15'),
        location: 'IT Storage Room A',
        createdById: admin.id,
      },
    }),
  ]);

  console.log(`Created ${phones.length} phones and ${tablets.length} tablets`);

  // =============================================================================
  // SAMPLE ASSIGNMENTS
  // =============================================================================

  console.log('Creating sample assignments...');

  // Assign laptop to John Doe
  const johnAssignment = await prisma.assignment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      itemId: laptops[0].id,
      employeeId: employees[0].id,
      assignedById: manager.id,
      assignedAt: new Date('2024-02-01'),
      conditionAtAssignment: ItemCondition.NEW,
      acknowledged: true,
      acknowledgedAt: new Date('2024-02-01'),
      purpose: 'Primary work laptop',
    },
  });

  // Update laptop status
  await prisma.item.update({
    where: { id: laptops[0].id },
    data: { status: ItemStatus.ASSIGNED },
  });

  // Assign monitor to Jane Smith
  const janeAssignment = await prisma.assignment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      itemId: monitors[0].id,
      employeeId: employees[1].id,
      assignedById: manager.id,
      assignedAt: new Date('2024-02-15'),
      expectedReturnAt: new Date('2025-02-15'),
      conditionAtAssignment: ItemCondition.NEW,
      acknowledged: false,
      purpose: 'Design work monitor',
    },
  });

  // Update monitor status
  await prisma.item.update({
    where: { id: monitors[0].id },
    data: { status: ItemStatus.ASSIGNED },
  });

  console.log(`Created ${2} sample assignments`);

  // =============================================================================
  // SAMPLE AUDIT LOGS
  // =============================================================================

  console.log('Creating sample audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: 'User',
        entityId: admin.id,
        action: 'CREATE',
        userId: admin.id,
        after: { email: admin.email, role: admin.role },
        metadata: { ipAddress: '127.0.0.1', userAgent: 'Seed Script' },
      },
      {
        entityType: 'Item',
        entityId: laptops[0].id,
        action: 'CREATE',
        userId: admin.id,
        after: { assetId: laptops[0].assetId, name: laptops[0].name },
        metadata: { ipAddress: '127.0.0.1', userAgent: 'Seed Script' },
      },
      {
        entityType: 'Assignment',
        entityId: johnAssignment.id,
        action: 'ASSIGN',
        userId: manager.id,
        after: { itemId: laptops[0].id, employeeId: employees[0].id },
        metadata: { ipAddress: '127.0.0.1', userAgent: 'Seed Script' },
      },
    ],
  });

  console.log('Created sample audit logs');

  // =============================================================================
  // SUMMARY
  // =============================================================================

  const totalItems = await prisma.item.count();
  const totalEmployees = await prisma.employee.count();
  const totalAssignments = await prisma.assignment.count();
  const totalUsers = await prisma.user.count();

  console.log('\n========================================');
  console.log('Database seed completed successfully!');
  console.log('========================================');
  console.log(`Users: ${totalUsers}`);
  console.log(`Employees: ${totalEmployees}`);
  console.log(`Items: ${totalItems}`);
  console.log(`Assignments: ${totalAssignments}`);
  console.log('\nTest credentials:');
  console.log('  Admin: admin@company.com / admin123');
  console.log('  Manager: manager@company.com / manager123');
  console.log('  Viewer: viewer@company.com / viewer123');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
