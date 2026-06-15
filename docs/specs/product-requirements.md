# Product Requirements Document (PRD)
## Project Name: Somoby Somity (Cooperative Society ERP)
## Document Path: `docs/specs/product-requirements.md`

---

## 1. Product Vision

The **Somoby Somity ERP System** is a secure, transparent, and web-based Cooperative Society & Accounts Management software. The system aims to digitalize all manual paperwork, subscriptions, shares, expenditures, banking activities, and dividends. By enforcing strict business rules, dual-control workflows, automated calculations, and a comprehensive audit trail, the software eliminates financial opacity, secures member assets, and provides real-time visibility into the society's financial health.

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization Module
*   **REQ-AUTH-01 (Secure Login)**: The system must provide a clean login portal requiring Username/Email and Password with error handling (red indicator: "আপনার আইডি বা পাসওয়ার্ড ভুল" for invalid credentials).
*   **REQ-AUTH-02 (Password Reset)**: Users must be able to request a password reset, triggering an OTP verification code via Email or SMS.
*   **REQ-AUTH-03 (Role-Based Access Control)**:
    *   **Super Admin / President (Md. Zohirul Islam Sobuj)**: Absolute permissions to view, add, edit, and delete any configuration or data.
    *   **Accountant**: Permissions for ledger entry, expenses, deposits, and reports. Blocked from deleting users.
    *   **Collection Officer**: Restricted to entering weekly or monthly member deposit transactions.
    *   **General Member**: Read-only access to their own deposits, shares, and personal passbook statements. Blocked from viewing other member data.

### 2.2 Executive Dashboard Module
*   **REQ-DASH-01 (Summary Widgets)**: Display real-time counts of:
    *   Total Active Members
    *   Total Shares Issued
    *   Total Funds Deposited
    *   Total Expenses Incurred
    *   Current Combined Bank Balance
    *   Current Cash-on-Hand Balance
*   **REQ-DASH-02 (Visual Analytics)**: Render interactive monthly collection vs. expense comparison charts.

### 2.3 Member & Nominee Management
*   **REQ-MEMB-01 (Member Registration)**: Form to record Name, Phone Number, Email, Address, Join Date, and Status (Active/Inactive).
*   **REQ-MEMB-02 (Unique Identification)**: Auto-generate a unique Member ID upon successful registration. Prevent duplicate phone numbers from registering.
*   **REQ-MEMB-03 (Admission Fee)**: Log a mandatory registration admission fee of 5,000 BDT.
*   **REQ-MEMB-04 (Nominee Profile)**: Each member profile must store Nominee details: Name, Relationship, Phone Number, Address, and Emergency Contact.

### 2.4 Deposit & Share Module
*   **REQ-DEP-01 (One-Time Multiple Bill Entry)**: Provide a bulk payment interface allowing a collection officer to record multiple transaction types (weekly subscription, monthly subscription dues, admission fees, penalties) in a single submission for a member.
*   **REQ-DEP-02 (Transaction Form Details)**: Capture Member ID, Payment Mode (Bank/Cash), Transaction Category, Amount, Share Calculation (automatically calculated at 1,000 BDT per share), Billing Period (Month/Week), Payment Receipt Image Upload, and Remarks.
*   **REQ-DEP-03 (Digital Receipt)**: Generate a digital printable receipt immediately upon payment verification.

### 2.5 Expense Management Module
*   **REQ-EXP-01 (Expense Form)**: Log expenses with Category (Land Purchase, Office Rent, Transport, Entertainment, etc.), Transaction Date, Amount, Project Name (e.g., Tushbhander Sadar Project), Location, and Bill Attachment image upload.
*   **REQ-EXP-02 (Double-Signoff Expense Approval)**: Accountant-logged expenses must remain "Pending" and must not impact balances until approved by the President or Admin Panel.

### 2.6 Bank & Cash Management Module
*   **REQ-BANK-01 (Multi-Account Setup)**: Allow setup of multiple bank accounts with unique account numbers.
*   **REQ-BANK-02 (Fund Transactions)**: Record deposits, withdrawals, and inter-bank transfers.
*   **REQ-BANK-03 (Joint Signature Control)**: Track approvals from the President, Secretary, and Treasurer for all banking ledger items.

### 2.7 Accounts & Dividend Distribution Module
*   **REQ-ACC-01 (Project Ledger)**: Track investments and returns under dedicated project funds.
*   **REQ-ACC-02 (Capital Ratio Share)**: Automatically distribute project profits to participating members proportional to their capital contributions.
*   **REQ-ACC-03 (Year-End Profit Distribution)**: Calculate and divide general net profit into:
    *   **95%**: Business Development Fund
    *   **2.5%**: Poor & Destitute Fund
    *   **2.5%**: Sports & Entertainment Fund
    *   **7.5% of Total Profit**: Transferred to a separate Fixed Deposit fund registered in the organization's name.
*   **REQ-ACC-04 (Member Suspension/Exit Settlements)**:
    *   Deceased members' funds must be transferred to the registered Nominee, or distributed equally to existing members using the "Share Transfer to Existing Members" utility.
    *   Canceled memberships must pay out principal savings on the annual fiscal closing day, excluding accumulated dividends.

### 2.8 Reporting Module
*   **REQ-REP-01 (Exports & Print)**: One-click PDF download, CSV export, and print functions for all reports.
*   **REQ-REP-02 (Report Catalog)**:
    *   Monthly Collection Report
    *   Categorized & Project Expenses Report
    *   Individual Member Ledger Statement (Passbook format: deposits, dates, and fines)
    *   Balance Sheet (Assets and Liabilities)
    *   Profit and Loss Statement
    *   Bank Ledger Statements

### 2.9 System Security & Recovery Module
*   **REQ-SEC-01 (System Audit Log)**: Record login history, database insertions, modifications, and deletions including User ID, Date/Time, Client IP, and Before/After snapshots of modified payloads.
*   **REQ-SEC-02 (Nightly Automated Backups)**: Secure database backup compiled every night to a cloud environment, with a one-click administrative restore function.

---

## 3. Non-Functional Requirements

### 3.1 Security & Compliance
*   **NFR-SEC-01 (Access Denial)**: Block back-button navigation to system pages once a user session is logged out.
*   **NFR-SEC-02 (SQL Injection & XSS Protection)**: Sanitize all inputs across API boundaries.
*   **NFR-SEC-03 (Session Timeout)**: Clear active sessions after 30 minutes of user inactivity.

### 3.2 Performance & Reliability
*   **NFR-PERF-01 (Response Time)**: Report queries and database mutations must resolve in less than 2.0 seconds under normal load.
*   **NFR-PERF-02 (Linter Compliance)**: ESLint and Prettier setups must compile with 0 warnings.
*   **NFR-PERF-03 (Build Isolation)**: Multi-stage Docker environments must isolate development packages from production deployment images.

### 3.3 Reliability & Availability
*   **NFR-AVAIL-01 (Cloud Backups)**: Nightly backups must have 99.9% storage durability.
*   **NFR-AVAIL-02 (Error Bounds)**: Graceful degradation displaying explicit error alerts without disclosing stack traces.

---

## 4. User Stories

### US-01: Bulk Subscription Entry
*   **As a** Collection Officer
*   **I want to** select a member and log their weekly dues, monthly dues, and late fines in a single form
*   **So that** I can process transactions efficiently without submitting multiple separate forms.

### US-02: Joint Signature Validation
*   **As a** Treasurer
*   **I want to** approve a pending banking withdrawal transaction in the portal
*   **So that** my approval is officially logged along with the President's and Secretary's signatures.

### US-03: Member Statement Access
*   **As a** General Member
*   **I want to** log in and view my personal passbook statement and total share count
*   **So that** I can verify my investments without viewing other members' financial data.

### US-04: Project Profit Ratio Distribution
*   **As an** Accountant
*   **I want the system to** calculate and distribute project profits automatically based on member investment ratios
*   **So that** I do not have to perform manual capital-ratio calculations.

---

## 5. Acceptance Criteria

### AC-01: Bulk Payment (Given-When-Then)
*   **Given** a collection officer is on the deposit screen and has selected Member ID `MEM-1002`,
*   **When** they check the boxes for "Weekly Subscription" (1,000 BDT) and "Admission Fee" (5,000 BDT), upload a transaction slip, and submit,
*   **Then** the system must create two ledger records, update the member's share count by 1, increment the cash-on-hand balance by 6,000 BDT, and render a printable digital money receipt.

### AC-02: Expense Balance Enforcement
*   **Given** the current cash-on-hand balance is 15,000 BDT and the bank account has 50,000 BDT,
*   **When** an accountant attempts to log an office rent expense of 70,000 BDT,
*   **Then** the system must block submission, show the error "পর্যাপ্ত ব্যালেন্স নেই" (Insufficient Balance), and prevent any updates to the database ledgers.

### AC-03: Account Inactivity Suspension
*   **Given** an active member has not logged any subscription deposits for 12 consecutive weeks (3 months),
*   **When** the cron scheduler checks membership status,
*   **Then** the system must update the member status to "Suspended" (সাসপেন্ড) and block them from access.

---

## 6. Business Rules

1.  **Late Fee Reactivation**: Suspended members can be reactivated only after paying all accumulated dues plus a mandatory **10% penalty fee (Late Fee)** on the total outstanding balance.
2.  **Salary Entry Restriction**: Partner/member salary entries are locked and blocked programmatically for **5 years (Fiscal Years 2026 to 2031)**.
3.  **Fiscal Year Locking**:
    *   First Fiscal Year: Defined strictly from project launch to **June 30, 2026**.
    *   Subsequent Fiscal Years: Strict lock from **July 1st** to **June 30th** of the following year. Users are blocked from overriding these dates.
4.  **No Profits on Early Exit**: Members who cancel their membership are refunded only their principal savings on the annual closing day. They do not receive any dividends.
5.  **Fixed Deposit Allocation**: A mandatory **7.5%** of all net profits must be transferred to a dedicated corporate Fixed Deposit account before secondary distributions.

---

## 7. Edge Cases

*   **Duplicate Registration Attempts**: A user enters an existing phone number under a different email. The system must query the database and trigger a validation block on duplication of either key.
*   **Overdraft on Expense Logging**: An accountant logs a pending expense matching available balance, but before approval, another expense is approved. The system must re-evaluate available balances at the *approval phase* and block approval if balances drop below the expense value.
*   **Mid-Year Death Claims**: If a member dies mid-fiscal year, the system must support Nominee payouts or divide the active shares among remaining members. The system must adjust the denominator of the share ratios instantly to avoid calculation gaps in ongoing projects.
*   **Simultaneous Joint Signature Submissions**: Two joint signees approve a bank transaction concurrently. The system must employ database transactions (Prisma transactional execution) to verify state updates and ensure the ledger registers "Approved" only after the third signee's stamp.

---

## 8. Risk Analysis & Mitigations

### 8.1 Data Loss / Recovery Failure
*   **Risk**: Database corruption or host server crash resulting in transaction history loss.
*   **Mitigation**: Nightly automated dumps to an offsite secure cloud (S3 bucket configuration) with database seeds. Restoration steps must be tested and documented in CI pipelines.

### 8.2 Unauthorized Ledger Alterations (Fraud)
*   **Risk**: An accountant or administrator alters transaction records to cover cash discrepancies.
*   **Mitigation**: Restrict database update/delete queries. All changes must go through reversing ledger entries. The system audit log must capture before-and-after snapshots, IP addresses, and user identifiers on every write operation.

### 8.3 Inaccurate Dividend Allocations
*   **Risk**: Floating-point rounding errors causing discrepancies in capital ratio profit distributions.
*   **Mitigation**: Perform financial calculations using integer values (storing amounts in paisa/cents) or use Prisma's `Decimal` type to prevent rounding issues.
