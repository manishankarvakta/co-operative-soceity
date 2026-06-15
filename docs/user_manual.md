# Cooperative Society ERP - Comprehensive User Manual

Welcome to the **Cooperative Society Accounts Management ERP** User Manual. This document provides complete instructions for all user roles (Admin, Accountant, President, Secretary, Treasurer, etc.) to successfully navigate and operate the ERP system.

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Authentication & Roles](#2-authentication--roles)
3. [Member Management](#3-member-management)
4. [Deposit & Collections](#4-deposit--collections)
5. [Share Management](#5-share-management)
6. [Expense Management](#6-expense-management)
7. [Bank Transactions & Multi-Signature](#7-bank-transactions--multi-signature)
8. [Projects & Investments](#8-projects--investments)
9. [Accounting & Ledger (Double Entry)](#9-accounting--ledger-double-entry)
10. [Reports & Analytics](#10-reports--analytics)
11. [System Backups](#11-system-backups)

---

## 1. Introduction
The Cooperative ERP is a full-scale web application designed specifically for cooperative societies to manage members, weekly savings, share distributions, multi-signature bank transactions, project investments, and double-entry accounting. The system strictly adheres to cooperative financial standards and provides real-time audit logs and reports.

---

## 2. Authentication & Roles
To access the system, you must log in using your registered Email and Password. 

### Role-Based Access Control (RBAC)
The system uses strict roles. Your access depends on your assigned role:
* **Super Admin**: Has complete access to all modules, system settings, and user management.
* **Accountant**: Can record deposits, log expenses, and create journal entries.
* **President / Secretary / Treasurer**: Required for the **Multi-Signature** approval flow in Bank Transactions. Can view reports and approve their respective signatures.
* **Officer**: Can collect deposits and view basic member profiles.

---

## 3. Member Management
The Member Module allows you to onboard and track cooperative members and their nominees.

### Adding a New Member
1. Navigate to **Members** from the sidebar.
2. Click on **"+ New Member"**.
3. Fill in the member details: Name, Phone, Email, Address, and Join Date.
4. A unique `Member Code` will be automatically generated.
5. **Nominee Information**: Add the Nominee’s Name, Relationship, Emergency Contact, and Address.
6. Click **Save**.

### Managing Members
* **Statuses**: Members can be `ACTIVE`, `INACTIVE`, or `SUSPENDED`.
* **Profile View**: Click on a member to view their complete profile, including deposit history, shares owned, and nominee details.
* **Soft Deletion**: Deleting a member only marks them as deleted (soft-delete) to preserve historical financial records.

---

## 4. Deposit & Collections
The Deposit module tracks the cooperative's core income streams.

### Recording a Deposit
1. Go to **Deposits > Collect Deposit**.
2. Select the Member by typing their Name or Member Code.
3. Add **Deposit Items**:
   * **Weekly Subscription**: Standard weekly savings.
   * **Admission Fee**: One-time onboarding fee.
   * **Penalty**: Late fees or fines.
   * **Other**: Miscellaneous collections.
4. Set the **Payment Mode** (Cash or Bank).
5. (Optional) Upload an image of the physical receipt.
6. Submit the form to record the collection.

*Note: Once recorded, deposits automatically update the member's ledger.*

---

## 5. Share Management
Shares represent the ownership distribution of the cooperative.

* **Share Ledger**: Go to **Shares** to view the total number of shares distributed and the overall value.
* **Purchasing Shares**: Shares can be purchased or allocated to members. The system automatically maintains the total count of shares per member.
* **Share History**: Clicking on a member in the Share Ledger opens the **Share Transaction Log**, which shows a detailed history of every share acquired.

---

## 6. Expense Management
All cooperative expenditures must be logged and approved through this module.

### Logging an Expense
1. Go to **Expenses**.
2. Click **"+ Add Expense"**.
3. Provide the Category, Amount, Date, and Description.
4. If the expense is related to a specific **Project**, select it from the dropdown.
5. Upload the physical invoice/receipt as proof.
6. Submit. The expense will now be in `PENDING` status.

### Approving Expenses
* Authorized users (e.g., Admins/Accountants) must review `PENDING` expenses.
* They can **Approve** or **Reject** the expense. Only approved expenses will reflect in the final accounting reports.

---

## 7. Bank Transactions & Multi-Signature
To prevent fraud, large withdrawals and bank transactions require multi-signature authorization.

### Initiating a Transaction
1. Go to **Bank > Transactions**.
2. Create a new `DEBIT` (Withdrawal) or `CREDIT` (Deposit) entry for a specific Bank Account.

### Multi-Signature Approval Workflow
For withdrawals, the transaction will remain in a pending state until authorized by the executive committee:
1. The **President** logs in and clicks "Sign as President".
2. The **Secretary** logs in and clicks "Sign as Secretary".
3. The **Treasurer** logs in and clicks "Sign as Treasurer".
Once all three signatures are collected, the transaction is marked as `Approved` and the bank balance is updated.

---

## 8. Projects & Investments
Cooperatives often invest member funds into business projects.

* **Create a Project**: Define the Project Name, Location, and Target Capital. The project status starts as `FUNDING`.
* **Member Investments**: Members can invest their funds directly into specific projects.
* **Profit Distribution**: Once a project yields profit, navigate to **Accounting > Profit Distribution** to execute a split:
  * 95% goes to the Business Development Fund.
  * 2.5% to the Destitute/Poor Fund.
  * 2.5% to Sports & Entertainment.
  * 7.5% goes to a Fixed Deposit Reserve.

---

## 9. Accounting & Ledger (Double Entry)
The ERP includes a strict Double-Entry Accounting module.

* **Chart of Accounts (COA)**: Create and manage ledger accounts across 5 types: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, and `EXPENSE`.
* **Journal Vouchers**: Record custom multi-line journal entries. Ensure total Debits strictly equal total Credits before posting.
* Automatically balances with Deposits, Expenses, and Bank Transactions.

---

## 10. Reports & Analytics
The **Reports** module provides real-time financial statements:
* **Trial Balance**: Verifies the mathematical accuracy of the double-entry ledgers.
* **Balance Sheet**: Displays Assets vs. Liabilities + Equity.
* **Profit & Loss (Income Statement)**: Calculates net income by subtracting Expenses from Revenues.
* **Member Statements**: Generate individual PDF-ready statements for members showing their lifetime deposits and shares.

---

## 11. System Backups
To ensure data safety, the system provides automated and manual database backups.

* **Automated Backups**: The system automatically dumps the PostgreSQL database every night at midnight.
* **Manual Backup / Restore**: Admins can visit the **Backups** tab to download previous SQL dump files or upload a backup file to restore the database to a previous state. 
* *Warning: Restoring a database overwrites all current data. Do this with caution.*
