# Role-Based Access Control (RBAC) Matrix
## Document Path: `docs/security/rbac-matrix.md`

This document defines the permissions and access control rules for the Cooperative Society ERP system roles: `SUPER_ADMIN`, `ACCOUNTANT`, `COLLECTION_OFFICER`, and `MEMBER`.

---

## 1. Permission Matrix Table

The following matrix maps application permissions to the four defined roles.

| Permission Code | Description | SUPER_ADMIN | ACCOUNTANT | COLLECTION_OFFICER | MEMBER |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `MEMB_CREATE` | Register new members | **Allowed** | **Allowed** | Denied | Denied |
| `MEMB_UPDATE` | Edit member profiles | **Allowed** | Denied | Denied | Denied |
| `MEMB_DELETE` | Soft-delete members | **Allowed** | Denied | Denied | Denied |
| `DEP_RECORD` | Log weekly/monthly deposits | **Allowed** | **Allowed** | **Allowed** | Denied |
| `DEP_VOID` | Soft-delete deposits | **Allowed** | Denied | Denied | Denied |
| `EXP_CREATE` | Log expenses | **Allowed** | **Allowed** | Denied | Denied |
| `EXP_APPROVE` | Approve pending expenses | **Allowed** | Denied | Denied | Denied |
| `BANK_TRANS` | Log bank account transactions | **Allowed** | **Allowed** | Denied | Denied |
| `BANK_APPR` | Joint signature bank approval | **Allowed** | Denied | Denied | Denied |
| `PROJ_MANAGE` | Create & close projects | **Allowed** | Denied | Denied | Denied |
| `PROJ_INVEST` | Record member project investments| **Allowed** | **Allowed** | Denied | Denied |
| `PROF_DIST` | Distribute dividends | **Allowed** | Denied | Denied | Denied |
| `USER_MANAGE` | Create and delete auth users | **Allowed** | Denied | Denied | Denied |
| `REP_VIEW_ALL`| View society-wide reports | **Allowed** | **Allowed** | Denied | Denied |
| `REP_VIEW_OWN`| View personal statement report | **Allowed** | **Allowed** | **Allowed** | **Allowed** |
| `AUDIT_VIEW` | View database audit logs | **Allowed** | Denied | Denied | Denied |

---

## 2. Authorization Rules

### 2.1 Next.js Middleware Gateways
*   **Static Page Guard**: Next.js middleware inspects NextAuth v5 session tokens before rendering frontend layouts.
*   **Path Restrictions**:
    *   `/dashboard/admin/*` -> Requires `role === SUPER_ADMIN`.
    *   `/dashboard/accounts/*` -> Requires `role === SUPER_ADMIN` or `role === ACCOUNTANT`.
    *   `/dashboard/deposits/*` -> Requires `role === SUPER_ADMIN`, `role === ACCOUNTANT`, or `role === COLLECTION_OFFICER`.
    *   `/dashboard/member/*` -> Requires `role === MEMBER`.

### 2.2 API Route Guards
Even if middleware filters page loads, API route handlers must validate permissions programmatically using session tokens:
1.  **Extract Token**: Read JWT payload from request.
2.  **Evaluate Permission**: Query role permissions matching the requested endpoint.
3.  **Halt on Mismatch**: If the user role lacks the designated permission, immediately return `403 Forbidden` with the payload:
    ```json
    {
      "success": false,
      "code": "UNAUTHORIZED_ACTION",
      "message": "আপনার এই কাজটি করার অনুমতি নেই।"
    }
    ```
