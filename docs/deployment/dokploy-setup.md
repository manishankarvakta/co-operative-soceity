# Production Deployment Guide: Dokploy Orchestration
## Document Path: `docs/deployment/dokploy-setup.md`

This guide details the deployment of the Cooperative Society ERP system using **Dokploy**, a self-hosted platform-as-a-service (PaaS). Dokploy orchestrates applications, databases, and Docker Compositions, automating Let's Encrypt HTTPS certificates and load balancing.

---

## 1. Prerequisites
Before beginning deployment, ensure your target host has:
1.  **Docker & Docker Compose** installed.
2.  **Dokploy** installed and running on the server (usually on port `3000` or custom setup).
3.  A **Domain Name** pointed to your server's public IP address (A-Record).

---

## 2. Option A: Unified Docker Compose Deployment (Recommended)
This approach launches the Next.js ERP app, PostgreSQL, and Redis as a single stack using our [docker-compose.yml](file:///d:/ratul%2520project/company/co-operative-soceity/docker-compose.yml) file.

### Step 1: Create a Project in Dokploy
1.  Navigate to your Dokploy Dashboard.
2.  Click **Create Project** and name it `Cooperative Society ERP`.
3.  Click **Create Service** and select **Compose**.
4.  Name the compose service `erp-production`.

### Step 2: Upload docker-compose.yml
1.  Select the `erp-production` compose service.
2.  In the configuration tab, copy the contents of the root [docker-compose.yml](file:///d:/ratul%2520project/company/co-operative-soceity/docker-compose.yml) and paste it into the Dokploy compose editor.
3.  Click **Save**.

### Step 3: Configure Environment Variables
In the **Environment** tab, configure the production environment variables. Make sure to replace default passwords and secrets:

| Variable Name | Production Description / Recommendation |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://erp_prod_user:<STRONG_PASSWORD>@postgres:5432/cooperative_db?schema=public` |
| `POSTGRES_USER` | `erp_prod_user` |
| `POSTGRES_PASSWORD` | `<STRONG_PASSWORD>` |
| `POSTGRES_DB` | `cooperative_db` |
| `REDIS_URL` | `redis://redis:6379` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate a secure secret. |
| `NEXTAUTH_URL` | `https://your-domain.com` |
| `BACKUP_DIR` | `/app/backups` |
| `BACKUP_CRON_HOUR` | `0` (runs backups at 12:00 AM/midnight server local time) |
| `BACKUP_CRON_MINUTE` | `0` |

### Step 4: Configure Domains & SSL
1.  Navigate to the **Domains** settings of the `web` container service inside the compose dashboard.
2.  Add your production domain name (e.g. `erp.cooperative-society.com`).
3.  Set the target container port to `3000`.
4.  Enable **SSL/HTTPS**. Dokploy will automatically handle Let's Encrypt certificate registration and renewals.

### Step 5: Persistent Volumes Check
Dokploy automatically processes the named volume declarations in `docker-compose.yml`:
*   `postgres-data`: Persists PostgreSQL table data at `/var/lib/postgresql/data`.
*   `redis-data`: Persists caching keys and rate limit stats at `/data`.
*   `backup-data`: Persists database backup SQL/JSON snapshot archives at `/app/backups`.

Click **Deploy** to start all services.

---

## 3. Option B: Separate Dokploy Templates (Advanced)
If you prefer to manage PostgreSQL and Redis as dedicated database service items within Dokploy's separate tab interface:

1.  **PostgreSQL Service**:
    *   Click **Create Service** -> **Database** -> **PostgreSQL**.
    *   Name it `erp-db`.
    *   Copy the connection credentials provided by Dokploy.
2.  **Redis Service**:
    *   Click **Create Service** -> **Database** -> **Redis**.
    *   Name it `erp-cache`.
    *   Copy the Redis connection URL.
3.  **ERP Application Service**:
    *   Click **Create Service** -> **Application**.
    *   Connect your Git Repository and select the production branch.
    *   Set the **Port** to `3000`.
    *   In the **Mounts/Volumes** tab, add a new volume mount:
        *   **Host Path**: Choose a directory on your host (e.g. `/var/backups/erp`).
        *   **Mount Path**: `/app/backups` (this points to our Docker Volume backups folder).
    *   In the **Environment** tab, set:
        *   `DATABASE_URL`: Connection string of the Dokploy PostgreSQL service.
        *   `REDIS_URL`: Connection URL of the Dokploy Redis service.
        *   `PG_DUMP_PATH`, `PSQL_PATH`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` etc.

---

## 4. Monitoring & Health Status Checks

### Container Monitoring
Dokploy provides real-time resource utilization indicators under the **Metrics** tab:
*   **CPU Usage**: Set alert flags if CPU exceeds 80% for prolonged periods.
*   **Memory Footprint**: The Next.js ERP app typically consumes between 200MB and 500MB of RAM.
*   **Disk I/O**: Monitor disk consumption as backups accumulate.

### Container Health Checks
Our configuration exposes a comprehensive healthcheck API route handler:
*   **Endpoint**: `/api/health`
*   **Behavior**: Executes dynamic queries to verify that the database is active and pings Redis.
*   **Docker Integration**: The compose check queries this route every 15 seconds. If the container becomes unresponsive, Docker marks it as `unhealthy` and Dokploy will automatically restart the instance.

### Viewing Logs
To verify that daily backups are triggering successfully:
1.  Go to the application container logs in the Dokploy UI.
2.  Filter or search for logs containing `[BackupService]`.
3.  Automated midnight backup checks are logged as:
    `[BackupService] Triggering daily automated backup...`
