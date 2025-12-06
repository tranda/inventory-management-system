# Spec Kit Input for /speckit.specify Command

## How to Use

Run this prompt with the `/speckit.specify` command in your AI coding agent after initializing your project with `specify init`.

---

## /speckit.specify Prompt

```
/speckit.specify

Build an IT Inventory Management System - a web application for tracking company IT equipment, managing asset assignments to employees, and maintaining complete equipment history.

The primary users are IT administrators who manage the equipment, with secondary access for department managers (view and request) and employees (view their assigned items).

### Inventory Management

Users should be able to add new IT assets to the inventory with details including: a unique asset identifier (can be auto-generated or manually entered), item name, category (such as Laptop, Monitor, Keyboard, Mouse, Headset, Phone, Tablet, Cables, Software License, or Other), brand/manufacturer, model number, serial number, purchase date, purchase price, warranty expiration date, current condition (New, Good, Fair, Needs Repair, or Decommissioned), storage location, notes/description, and optional photo.

Users should be able to edit any item's details and view the modification history showing who changed what and when. Items can be soft-deleted (marked as decommissioned with a reason) or permanently deleted by admins with confirmation. Bulk delete should be supported.

The inventory should be viewable in both list and card/grid views. Users need to filter by category, status, condition, location, and availability. Search should work across name, serial number, asset ID, brand, and model. Export to CSV or Excel format should be available.

### Assignment Management

When assigning an item to an employee, the system should capture: the item being assigned, the employee receiving it (from a directory or manual entry), assignment date, expected return date (optional), purpose or reason for assignment, who is performing the assignment, condition at time of assignment, optional digital acknowledgment or signature, and any notes.

When an item is returned, the system should record: return date, condition at return, any damage notes or issues, who received the returned item. The item should automatically become available for the next assignment.

Items should be transferable directly from one employee to another, recording the transfer date and reason.

### History and Tracking

For each item, there should be a complete timeline showing all assignments: who had it, when, for how long, condition changes over time, and any maintenance or repair records.

For each employee, show all items currently assigned to them and a history of all items they previously had, with assignment and return dates.

The system should maintain an audit log of all actions: user, action type, timestamp, and details. This log should be searchable and filterable.

### Item Status Management

Items should have the following statuses: Available (ready for assignment), Assigned (currently with someone), Reserved (held for upcoming assignment), In Repair (under maintenance), Decommissioned (no longer in use), and Lost/Stolen (reported missing).

Status should update automatically when items are assigned or returned. Manual status changes should require a reason.

### Dashboard and Reporting

The dashboard should show: total inventory count by category, available vs assigned breakdown, items due for return soon, items with expired warranties, recent activity feed, and alerts for low stock of consumables.

Reports should include: inventory summary, assignment history, equipment by employee, depreciation tracking, and warranty status. All reports should support custom date range filtering.

### Notifications

The system should send email notifications for: new assignments (to the person receiving equipment), return reminders before expected return date, overdue return alerts, warranty expiration warnings, and low stock alerts.

### Access Control

There should be three user roles:
- Admin: Full access to all features, user management, system configuration, permanent deletion
- Manager: Add/edit items, assign/return items, view all reports, but cannot delete permanently or manage users  
- Viewer: Read-only access to inventory, can only view their own assignments

### Key User Flows

1. Adding new equipment: IT admin receives new equipment, creates inventory record with all details, optionally uploads photo, equipment becomes available

2. Assigning equipment to employee: IT admin finds available item, selects employee, fills in assignment details, employee receives notification, item status changes to Assigned

3. Returning equipment: Employee brings item back, IT admin records return with condition assessment, item automatically becomes Available

4. Tracking equipment history: Manager wants to know who has had a specific laptop, views item detail page with complete assignment timeline

5. Finding available equipment: New employee needs a laptop, IT admin filters by category and availability, sees all available laptops with their condition and specs

6. Generating reports: End of quarter, manager needs equipment allocation report, selects date range and generates report showing all assignments during that period
```

---

## Notes

After running `/speckit.specify`, you should:

1. Use `/speckit.clarify` to address any `[NEEDS CLARIFICATION]` markers the AI adds
2. Then use `/speckit.plan` to provide your tech stack choices (e.g., "Use React with TypeScript for frontend, Node.js with Express for backend, PostgreSQL database")
3. Then use `/speckit.tasks` to generate the task breakdown
4. Finally use `/speckit.implement` to build the application
