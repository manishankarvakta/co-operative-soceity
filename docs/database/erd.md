# Database Entity-Relationship Diagram (ERD)
## Document Path: `docs/database/erd.md`

This document outlines the detailed Entity-Relationship Diagram (ERD) mapping all database models, attributes, keys, and relational constraints for the Cooperative Society ERP system.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string passwordHash
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    
    ROLE {
        uuid id PK
        string name UK
        string description
    }
    
    PERMISSION {
        uuid id PK
        string name UK
        string description
    }
    
    USER_ROLE {
        uuid userId PK, FK
        uuid roleId PK, FK
    }
    
    ROLE_PERMISSION {
        uuid roleId PK, FK
        uuid permissionId PK, FK
    }
    
    MEMBER {
        uuid id PK
        uuid userId FK
        string memberCode UK
        string name
        string phone UK
        string email
        string address
        datetime joinDate
        enum status
        datetime deletedAt
    }
    
    NOMINEE {
        uuid id PK
        uuid memberId UK, FK
        string name
        string relationship
        string phone
        string address
        string emergencyContact
        datetime deletedAt
    }
    
    DEPOSIT {
        uuid id PK
        uuid memberId FK
        uuid receivedById FK
        enum paymentMode
        uuid receiptId UK, FK
        string remarks
        datetime createdAt
        datetime deletedAt
    }
    
    DEPOSIT_ITEM {
        uuid id PK
        uuid depositId FK
        enum type
        int amount
        decimal sharesCount
        string periodDetails
        datetime deletedAt
    }
    
    SHARE_RECORD {
        uuid id PK
        uuid memberId FK
        uuid transactionId
        decimal count
        datetime createdAt
        datetime deletedAt
    }
    
    EXPENSE {
        uuid id PK
        string category
        datetime date
        int amount
        string projectName
        uuid projectId FK
        uuid receiptId UK, FK
        enum status
        uuid loggedById FK
        uuid approvedById FK
        datetime approvedAt
        datetime deletedAt
    }
    
    PROJECT {
        uuid id PK
        string name
        string location
        int targetCapital
        int currentCapital
        enum status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }
    
    PROJECT_INVESTMENT {
        uuid id PK
        uuid projectId FK
        uuid memberId FK
        int amount
        datetime createdAt
        datetime deletedAt
    }
    
    PROFIT_DISTRIBUTION {
        uuid id PK
        uuid projectId FK
        int totalProfit
        int devFund
        int destituteFund
        int sportsFund
        int fixedDeposit
        datetime createdAt
    }
    
    BANK_ACCOUNT {
        uuid id PK
        string name
        string accountNumber UK
        int balance
        datetime deletedAt
    }
    
    BANK_TRANSACTION {
        uuid id PK
        uuid bankAccountId FK
        int amount
        enum type
        boolean presidentApproved
        boolean secretaryApproved
        boolean treasurerApproved
        boolean isApproved
        string reference
        datetime createdAt
        datetime deletedAt
    }
    
    RECEIPT {
        uuid id PK
        string imageUrl
        int fileSize
        string mimeType
        datetime uploadedAt
    }
    
    NOTIFICATION {
        uuid id PK
        uuid userId FK
        string title
        string message
        boolean read
        datetime createdAt
    }
    
    AUDIT_LOG {
        uuid id PK
        uuid userId FK
        string action
        string tableName
        string recordId
        jsonb oldData
        jsonb newData
        string ipAddress
        datetime timestamp
    }
    
    BACKUP_HISTORY {
        uuid id PK
        string filename
        int fileSize
        string status
        datetime startedAt
        datetime completedAt
        string storagePath
    }

    USER ||--o{ USER_ROLE : "has roles"
    ROLE ||--o{ USER_ROLE : "assigned to users"
    ROLE ||--o{ ROLE_PERMISSION : "holds permissions"
    PERMISSION ||--o{ ROLE_PERMISSION : "assigned to roles"
    
    USER ||--|| MEMBER : "associated profile"
    MEMBER ||--|| NOMINEE : "has nominee"
    MEMBER ||--o{ DEPOSIT : "submits"
    MEMBER ||--o{ SHARE_RECORD : "owns"
    MEMBER ||--o{ PROJECT_INVESTMENT : "invests"
    
    DEPOSIT ||--|{ DEPOSIT_ITEM : "contains"
    DEPOSIT ||--|| RECEIPT : "has receipt"
    
    PROJECT ||--o{ PROJECT_INVESTMENT : "receives capital"
    PROJECT ||--o{ EXPENSE : "accrues expenses"
    PROJECT ||--o{ PROFIT_DISTRIBUTION : "generates yields"
    
    EXPENSE ||--|| RECEIPT : "has billing receipt"
    USER ||--o{ EXPENSE : "registers log"
    USER ||--o{ EXPENSE : "approves expense"
    
    BANK_ACCOUNT ||--o{ BANK_TRANSACTION : "posts ledger line"
    USER ||--o{ AUDIT_LOG : "generates events"
    USER ||--o{ NOTIFICATION : "receives"
```

---

## 2. Key Database Design Patterns

### 2.1 Soft Delete Architecture
Every core domain model (e.g. `User`, `Member`, `Deposit`, `Expense`, `Project`) contains a nullable `deletedAt` DateTime column.
*   **Active records**: `deletedAt IS NULL`.
*   **Soft deleted records**: `deletedAt IS NOT NULL` (stores deletion timestamp).
*   **Prisma implementation**: Read queries must apply `where: { deletedAt: null }` filter conditions unless checking historical logs.

### 2.2 Financial Precision
All currency columns (e.g. `amount`, `balance`, `totalProfit`) are stored as **Integers** representing BDT paisa/cents. This avoids IEEE 754 floating-point rounding errors during financial balancing calculations.
*   1 BDT = 100 Paisa (e.g. 5,000 BDT is stored in database as `500000`).

### 2.3 System Audit Log
The `AuditLog` table stores JSONB snapshots (`oldData` and `newData`) containing full record diffs, allowing rollback capabilities and satisfying fraud detection requirements.
