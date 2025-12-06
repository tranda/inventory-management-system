# Data Model: IT Inventory Management System

**Branch**: `001-it-inventory` | **Date**: 2025-12-05

## Overview

This document defines the database schema for the IT Inventory Management System using Prisma ORM with PostgreSQL.

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    User     │     │     Item     │     │  Employee   │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)      │     │ id (PK)     │
│ email       │     │ assetId      │     │ email       │
│ password    │     │ name         │     │ firstName   │
│ firstName   │     │ category     │     │ lastName    │
│ lastName    │     │ status       │     │ department  │
│ role        │     │ condition    │     │ isActive    │
│ isActive    │     │ ...          │     │ ...         │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                   │                    │
       │            ┌──────┴───────┐            │
       │            │              │            │
       ▼            ▼              ▼            ▼
┌─────────────────────────────────────────────────────┐
│                    Assignment                        │
├─────────────────────────────────────────────────────┤
│ id (PK)                                             │
│ itemId (FK) ─────────────────────────────► Item     │
│ employeeId (FK) ─────────────────────────► Employee │
│ assignedById (FK) ───────────────────────► User     │
│ returnedById (FK) ───────────────────────► User     │
│ assignedAt, returnedAt, ...                         │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│                    AuditLog                          │
├─────────────────────────────────────────────────────┤
│ id (PK)                                             │
│ entityType, entityId                                │
│ action                                              │
│ userId (FK) ─────────────────────────────► User     │
│ before (JSON), after (JSON)                         │
└─────────────────────────────────────────────────────┘
```

---

## Entities

### User

System users who can log in and perform actions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| email | String | Unique, required | Login email |
| passwordHash | String | Required | bcrypt hashed password |
| firstName | String | Required | User's first name |
| lastName | String | Required | User's last name |
| role | Enum | Required | ADMIN, MANAGER, VIEWER |
| isActive | Boolean | Default: true | Active status (soft disable) |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**: `email` (unique)

---

### Item

IT equipment tracked in the inventory.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| assetId | String | Unique, required | Human-readable asset ID (e.g., IT-2024-001) |
| name | String | Required | Item name (e.g., "Dell Latitude 5540") |
| category | Enum | Required | LAPTOP, MONITOR, KEYBOARD, MOUSE, HEADSET, PHONE, TABLET, CABLES, SOFTWARE_LICENSE, OTHER |
| status | Enum | Required, default: AVAILABLE | AVAILABLE, ASSIGNED, RESERVED, IN_REPAIR, DECOMMISSIONED, LOST_STOLEN |
| condition | Enum | Required, default: NEW | NEW, GOOD, FAIR, NEEDS_REPAIR, DECOMMISSIONED |
| brand | String | Optional | Manufacturer (e.g., "Dell", "Apple") |
| model | String | Optional | Model number |
| serialNumber | String | Unique, required | Serial number |
| purchaseDate | DateTime | Optional | Date of purchase |
| purchasePrice | Decimal | Optional | Purchase price (precision: 10,2) |
| warrantyExpiration | DateTime | Optional | Warranty end date |
| location | String | Optional | Storage location |
| notes | Text | Optional | Additional notes |
| photoUrl | String | Optional | Path to item photo |
| thumbnailUrl | String | Optional | Path to thumbnail |
| deletedAt | DateTime | Optional, null = active | Soft delete timestamp |
| decommissionReason | String | Optional | Reason for decommissioning |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |
| createdById | UUID | FK → User | User who created the item |

**Indexes**:
- `assetId` (unique)
- `serialNumber` (unique)
- `(category, status)` (composite)
- `(status, deletedAt)` (composite)
- Full-text on `(name, brand, model)`

**Validation Rules**:
- `name`: 1-200 characters
- `assetId`: Pattern `[A-Z0-9-]+`, max 50 chars
- `serialNumber`: 1-100 characters
- `purchasePrice`: >= 0

---

### Employee

Employees who can be assigned equipment.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| email | String | Unique, required | Employee email |
| firstName | String | Required | First name |
| lastName | String | Required | Last name |
| department | String | Optional | Department name |
| title | String | Optional | Job title |
| phone | String | Optional | Phone number |
| isActive | Boolean | Default: true | Active status |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**: `email` (unique), `(isActive)`, `(department)`

**Note**: Employees are distinct from Users. An employee may or may not have a User account.

---

### Assignment

Links items to employees for a period of time.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| itemId | UUID | FK → Item, required | The assigned item |
| employeeId | UUID | FK → Employee, required | The employee receiving the item |
| assignedById | UUID | FK → User, required | User who made the assignment |
| assignedAt | DateTime | Required | Assignment date |
| expectedReturnAt | DateTime | Optional | Expected return date |
| purpose | String | Optional | Reason for assignment |
| conditionAtAssignment | Enum | Required | Condition when assigned |
| acknowledged | Boolean | Default: false | Employee acknowledged receipt |
| acknowledgedAt | DateTime | Optional | Acknowledgment timestamp |
| notes | String | Optional | Assignment notes |
| returnedAt | DateTime | Optional, null = active | Return date |
| returnedById | UUID | FK → User, optional | User who processed return |
| conditionAtReturn | Enum | Optional | Condition when returned |
| returnNotes | String | Optional | Return/damage notes |
| transferredToId | UUID | FK → Assignment, optional | If transferred, link to new assignment |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**:
- `(itemId, returnedAt)` (composite) - find active assignment for item
- `(employeeId, returnedAt)` (composite) - find active assignments for employee
- `assignedAt` - for date range queries

**Business Rules**:
- An item can have only one active assignment (returnedAt IS NULL)
- returnedAt marks the end of an assignment
- Transfer creates a new assignment and links via transferredToId

---

### AuditLog

Immutable log of all system actions. **(Constitution Art. 5.4 Compliance)**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| entityType | String | Required | Entity type: "Item", "Assignment", "Employee", "User" |
| entityId | UUID | Required | ID of the affected entity |
| action | String | Required | Action type: CREATE, UPDATE, DELETE, ASSIGN, RETURN, TRANSFER, STATUS_CHANGE |
| userId | UUID | FK → User, required | User who performed the action |
| before | JSON | Optional | Entity state before change (null for CREATE) |
| after | JSON | Optional | Entity state after change (null for DELETE) |
| metadata | JSON | Required | Context including ipAddress and userAgent (Constitution Art. 5.4) |
| createdAt | DateTime | Auto | Timestamp of action |

**Metadata Structure** (Constitution Art. 5.4):
```json
{
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 ..."
}
```

**Indexes**:
- `(entityType, entityId)` (composite)
- `userId`
- `createdAt`
- `action`

**Note**: This table is append-only. No updates or deletes allowed (Constitution Art. 5.4).

---

## Enums

### UserRole
```
ADMIN      - Full system access
MANAGER    - Add/edit items, assign/return, view reports
VIEWER     - Read-only, own assignments only
```

### ItemCategory
```
LAPTOP
MONITOR
KEYBOARD
MOUSE
HEADSET
PHONE
TABLET
CABLES
SOFTWARE_LICENSE
OTHER
```

### ItemStatus
```
AVAILABLE      - Ready for assignment
ASSIGNED       - Currently with someone
RESERVED       - Held for upcoming assignment
IN_REPAIR      - Under maintenance
DECOMMISSIONED - No longer in use
LOST_STOLEN    - Reported missing
```

### ItemCondition
```
NEW
GOOD
FAIR
NEEDS_REPAIR
DECOMMISSIONED
```

---

## State Transitions

### Item Status Transitions

```
                    ┌─────────────┐
                    │   (new)     │
                    └──────┬──────┘
                           │ create
                           ▼
                    ┌─────────────┐
         ┌──────────│  AVAILABLE  │◄─────────┐
         │          └──────┬──────┘          │
         │                 │ assign          │ return
         │                 ▼                 │ (condition OK)
         │          ┌─────────────┐          │
         │          │  ASSIGNED   │──────────┘
         │          └──────┬──────┘
         │                 │ return
         │                 │ (needs repair)
         │                 ▼
         │          ┌─────────────┐
         │          │  IN_REPAIR  │──────────┐
         │          └─────────────┘          │
         │                                   │ repair complete
         │          ┌─────────────┐          │
         ├──────────│  RESERVED   │◄─────────┘
         │          └──────┬──────┘
         │                 │ assign
         │                 └──────────► ASSIGNED
         │
         │          ┌─────────────┐
         ├─────────►│DECOMMISSIONED│ (terminal, soft delete)
         │          └─────────────┘
         │
         │          ┌─────────────┐
         └─────────►│ LOST_STOLEN │ (manual status change)
                    └─────────────┘
```

**Automatic Transitions**:
- `AVAILABLE → ASSIGNED`: When assigned to employee
- `ASSIGNED → AVAILABLE`: When returned with good/fair condition
- `ASSIGNED → IN_REPAIR`: When returned with needs_repair condition

**Manual Transitions** (require reason):
- Any status → `DECOMMISSIONED`
- Any status → `LOST_STOLEN`
- `IN_REPAIR → AVAILABLE`: Repair complete
- `AVAILABLE → RESERVED`: Hold for future assignment
- `RESERVED → AVAILABLE`: Cancel reservation

---

## Prisma Schema

```prisma
// schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  MANAGER
  VIEWER
}

enum ItemCategory {
  LAPTOP
  MONITOR
  KEYBOARD
  MOUSE
  HEADSET
  PHONE
  TABLET
  CABLES
  SOFTWARE_LICENSE
  OTHER
}

enum ItemStatus {
  AVAILABLE
  ASSIGNED
  RESERVED
  IN_REPAIR
  DECOMMISSIONED
  LOST_STOLEN
}

enum ItemCondition {
  NEW
  GOOD
  FAIR
  NEEDS_REPAIR
  DECOMMISSIONED
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  firstName    String
  lastName     String
  role         UserRole
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdItems      Item[]       @relation("ItemCreatedBy")
  assignmentsMade   Assignment[] @relation("AssignedBy")
  returnsProcessed  Assignment[] @relation("ReturnedBy")
  auditLogs         AuditLog[]
}

model Item {
  id                  String        @id @default(uuid())
  assetId             String        @unique
  name                String
  category            ItemCategory
  status              ItemStatus    @default(AVAILABLE)
  condition           ItemCondition @default(NEW)
  brand               String?
  model               String?
  serialNumber        String        @unique
  purchaseDate        DateTime?
  purchasePrice       Decimal?      @db.Decimal(10, 2)
  warrantyExpiration  DateTime?
  location            String?
  notes               String?
  photoUrl            String?
  thumbnailUrl        String?
  deletedAt           DateTime?
  decommissionReason  String?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  createdById         String
  createdBy           User          @relation("ItemCreatedBy", fields: [createdById], references: [id])

  assignments Assignment[]

  @@index([category, status])
  @@index([status, deletedAt])
}

model Employee {
  id         String   @id @default(uuid())
  email      String   @unique
  firstName  String
  lastName   String
  department String?
  title      String?
  phone      String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  assignments Assignment[]

  @@index([isActive])
  @@index([department])
}

model Assignment {
  id                    String         @id @default(uuid())
  itemId                String
  item                  Item           @relation(fields: [itemId], references: [id])
  employeeId            String
  employee              Employee       @relation(fields: [employeeId], references: [id])
  assignedById          String
  assignedBy            User           @relation("AssignedBy", fields: [assignedById], references: [id])
  assignedAt            DateTime
  expectedReturnAt      DateTime?
  purpose               String?
  conditionAtAssignment ItemCondition
  acknowledged          Boolean        @default(false)
  acknowledgedAt        DateTime?
  notes                 String?
  returnedAt            DateTime?
  returnedById          String?
  returnedBy            User?          @relation("ReturnedBy", fields: [returnedById], references: [id])
  conditionAtReturn     ItemCondition?
  returnNotes           String?
  transferredToId       String?        @unique
  transferredTo         Assignment?    @relation("Transfer", fields: [transferredToId], references: [id])
  transferredFrom       Assignment?    @relation("Transfer")
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  @@index([itemId, returnedAt])
  @@index([employeeId, returnedAt])
  @@index([assignedAt])
}

// Constitution Art. 5.4: Audit trail with who, what, when, before/after, IP, user agent
model AuditLog {
  id         String   @id @default(uuid())
  entityType String
  entityId   String
  action     String
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  before     Json?    // Entity state before (null for CREATE)
  after      Json?    // Entity state after (null for DELETE)
  metadata   Json     // Required: { ipAddress, userAgent } per Constitution Art. 5.4
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
  @@index([action])
}
```

---

## Seed Data

Initial seed for development/testing:

```typescript
// seed.ts
const adminUser = {
  email: 'admin@company.com',
  passwordHash: await bcrypt.hash('admin123', 12),
  firstName: 'System',
  lastName: 'Administrator',
  role: 'ADMIN',
};

const categories = [
  { name: 'LAPTOP', sampleItems: 5 },
  { name: 'MONITOR', sampleItems: 10 },
  { name: 'KEYBOARD', sampleItems: 15 },
  // ... generate sample items per category
];

const sampleEmployees = [
  { email: 'john.doe@company.com', firstName: 'John', lastName: 'Doe', department: 'Engineering' },
  { email: 'jane.smith@company.com', firstName: 'Jane', lastName: 'Smith', department: 'Design' },
  // ... 10 sample employees
];
```
