# Database Migration Plan
## Document Path: `docs/database/migration-plan.md`

This document details the deployment setup, step-by-step commands, seeding plan, and index strategy for migrating the PostgreSQL database schema using Prisma ORM.

---

## 1. Local Configuration

Before running migration commands, ensure that environment settings are defined in a `.env` file at the project root.

```ini
# Database connection string pointing to target PostgreSQL instance
DATABASE_URL="postgresql://postgres:securepassword@localhost:5432/somoby_somity?schema=public"
```

---

## 2. Execution Sequence

Execute the following commands in the terminal workspace to initialize and apply database migrations.

### Step 1: Install Prisma CLI Dependencies
Verify that development dependencies are installed:
```bash
npm install prisma @prisma/client
```

### Step 2: Validate Prisma Schema
Verify the syntax structure of the schema file:
```bash
npx prisma validate
```

### Step 3: Run Initial DB Migration
Compile and apply the initial migration file to create tables, columns, constraints, and index arrays:
```bash
npx prisma migrate dev --name init
```
*   *Note*: This command will generate SQL files under `prisma/migrations/` and synchronize your Prisma client runtime types automatically.

---

## 3. Database Index Optimizations

The migration will automatically compile B-Tree indexes on lookup columns to maintain fast query performance:

1.  **Unique Checks**:
    *   `User(email)` index.
    *   `Member(phone)` index to block duplicate registrations.
    *   `Member(memberCode)` index.
    *   `BankAccount(accountNumber)` index.
2.  **Foreign Key Indices**:
    *   `Deposit(memberId)` and `Deposit(createdAt)` composite index for member ledger generation.
    *   `ProjectInvestment(projectId)` and `ProjectInvestment(memberId)` for calculating capital ratios.
    *   `AuditLog(timestamp)` index to support dashboard streams.

---

## 4. Seeding Strategy

After database migrations are applied, run the seeding script to populate initial static data profiles.

### Static Seeding Map
*   **Roles & Permissions**:
    *   Roles: `Super Admin`, `Accountant`, `Collection Officer`, `Member`.
    *   Permissions: `can_register_member`, `can_log_deposit`, `can_log_expense`, `can_approve_expense`, `can_view_reports`, `can_manage_users`.
*   **Default Accounts**:
    *   Root administrator profile (using Md. Zohirul Islam Sobuj's configuration details).
    *   Default Bank Accounts and Cash-on-Hand records with zero base balances.
*   **Fiscal Year Parameters**:
    *   Initial fiscal year closing configuration locked to June 30, 2026.

### Run Seed Command:
```bash
npx prisma db seed
```
