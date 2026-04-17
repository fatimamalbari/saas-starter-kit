# Multi-Tenant SaaS Starter Kit

A production-ready multi-tenant SaaS boilerplate built with Node.js, React, and PostgreSQL. Demonstrates tenant isolation, role-based access control, invite system, workspace switching, and clean monorepo architecture.

**[Live Demo](https://saas-starter-kit-web.vercel.app)**

## Architecture

```mermaid
graph TB
    subgraph Client["Frontend (React 19 + Vite)"]
        UI[Material UI Pages]
        Auth[Auth Context]
        API_Client[API Client]
    end

    subgraph Server["Backend (Express 5 + TypeScript)"]
        MW_Auth[Auth Middleware<br/>JWT Verification]
        MW_Tenant[Tenant Middleware<br/>x-tenant-id Resolution]
        MW_RBAC[RBAC Middleware<br/>Role Check]
        Routes[Route Handlers]
    end

    subgraph Database["PostgreSQL 16"]
        T_Tenants[(tenants)]
        T_Users[(users)]
        T_Memberships[(memberships)]
        T_Projects[(projects)]
        T_Invites[(invites)]
    end

    UI --> Auth
    Auth --> API_Client
    API_Client -->|HTTP + JWT + x-tenant-id| MW_Auth
    MW_Auth --> MW_Tenant
    MW_Tenant --> MW_RBAC
    MW_RBAC --> Routes
    Routes -->|Prisma ORM| T_Tenants
    Routes -->|Prisma ORM| T_Users
    Routes -->|Prisma ORM| T_Memberships
    Routes -->|Prisma ORM| T_Projects
    Routes -->|Prisma ORM| T_Invites

    style Client fill:#e0e7ff,stroke:#6366f1
    style Server fill:#fef3c7,stroke:#f59e0b
    style Database fill:#d1fae5,stroke:#10b981
```

### Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Middleware
    participant T as Tenant Middleware
    participant R as RBAC Middleware
    participant H as Route Handler
    participant DB as PostgreSQL

    C->>A: Request + Bearer token + x-tenant-id
    A->>A: Verify JWT, extract userId
    A->>T: Pass request
    T->>T: Validate UUID format
    T->>R: Pass request
    R->>DB: Find membership(userId, tenantId)
    DB-->>R: Membership + role
    R->>R: Check role permission
    R->>H: Authorized request
    H->>DB: Query scoped by tenantId
    DB-->>H: Tenant-isolated data
    H-->>C: JSON response
```

### Project Structure

```
saas-starter-kit/
├── apps/
│   ├── api/            # Express 5 + Prisma + PostgreSQL
│   └── web/            # React 19 + Vite + Material UI
├── packages/
│   ├── shared/         # Shared types and constants
│   └── typescript-config/
├── docker-compose.yml  # PostgreSQL
└── turbo.json          # Turborepo config
```

## Tech Stack

| Layer         | Technology                                    |
|---------------|-----------------------------------------------|
| Frontend      | React 19, TypeScript, Material UI 7, Vite     |
| Backend       | Node.js, Express 5, TypeScript                |
| Database      | PostgreSQL 16, Prisma ORM                     |
| Auth          | JWT (access tokens), bcrypt password hashing  |
| Monorepo      | Turborepo                                     |
| Infrastructure| Docker Compose                                |
| Deployment    | Vercel (frontend), Render (API), Neon (DB)    |

## Features

- **Multi-Tenancy** — shared database with row-level tenant isolation via middleware
- **Authentication** — signup (creates user + workspace), login, JWT-based sessions
- **Role-Based Access Control** — Owner, Admin, Member roles with middleware guards
- **Invite System** — token-based invites with smart detection (existing vs new users)
- **Workspace Selection** — post-login screen showing your workspaces and pending invites
- **Workspace Switching** — users can belong to multiple workspaces and switch via sidebar
- **Transfer Ownership** — owners can promote a member to Owner (auto-demotes to Admin), enabling safe handoff
- **Delete Workspace** — owners can delete a workspace from Settings (blocked if it's the user's last workspace)
- **Delete Account** — users can permanently delete their account, with clear impact summary and email confirmation
- **Tenant-Scoped CRUD** — projects resource fully isolated per tenant
- **Transactional Safety** — all mutations (signup, invite, role transfer, deletion) wrapped in DB transactions
- **Polished UI** — split-screen auth, gradient dashboard, skeleton loaders, empty states
- **Responsive Design** — sidebar layout, mobile-friendly with collapsible navigation

## User Flows

### Signup & Login

1. **Signup** creates a User + Tenant + Membership (role: OWNER)
2. **Login** returns user's workspaces + pending invites
3. **Workspace Selection** screen lets the user pick which workspace to enter or accept pending invites
4. If only 1 workspace and no invites, the user can go straight to the dashboard

### Invite Flow

```mermaid
sequenceDiagram
    participant Admin
    participant App as Frontend
    participant API as Backend
    participant DB as PostgreSQL
    participant Invitee as Invited User

    Admin->>App: Enter email + role
    App->>API: POST /api/members/invite
    API->>DB: Create invite record
    API-->>App: Invite link with signed JWT token
    Admin-->>Invitee: Share invite link

    Invitee->>App: Open /invite/:token
    App->>API: GET /api/members/verify-invite/:token
    API->>DB: Validate invite + check if account exists
    API-->>App: Tenant name, role, email, accountExists

    alt Account exists
        Invitee->>App: Click "Sign In to Accept"
        App-->>Invitee: Redirect to login with return URL
        Invitee->>App: Login
        App-->>Invitee: Redirect back to invite page
        Invitee->>App: Click "Accept Invitation"
        App->>API: POST /api/members/accept-invite
        API->>DB: Create membership + mark invite accepted (transaction)
    else New user
        Invitee->>App: Fill name + password
        App->>API: POST /api/auth/signup-with-invite
        API->>DB: Create user + membership + accept invite (transaction)
    end

    API-->>App: JWT token + tenant info
    App-->>Invitee: Redirected to Dashboard
```

### Account & Workspace Management

```mermaid
flowchart TD
    A[User wants to remove something] --> B{What to remove?}

    B -->|A workspace| C{Is it their last workspace?}
    C -->|Yes| D[❌ Blocked — use Delete Account instead]
    C -->|No| E{Are they the Owner?}
    E -->|No| F[❌ Not visible — only Owners can delete]
    E -->|Yes| G[Settings → Delete Workspace<br/>Type workspace name to confirm]
    G --> H[Workspace + projects + invites deleted<br/>User keeps account + other workspaces]

    B -->|Their account| I{Sole owner of any workspace<br/>that has other members?}
    I -->|Yes| J[❌ Blocked — transfer ownership first]
    J --> K[Members → Change role to Owner<br/>Current owner auto-demoted to Admin]
    K --> I
    I -->|No| L[Account → Delete Account<br/>Type email to confirm]
    L --> M[User deleted + solo-owned workspaces deleted<br/>Shared workspaces survive without them]

    style D fill:#fecaca,stroke:#dc2626
    style F fill:#fecaca,stroke:#dc2626
    style J fill:#fef3c7,stroke:#f59e0b
    style H fill:#d1fae5,stroke:#10b981
    style M fill:#d1fae5,stroke:#10b981
```

### Ownership Transfer

When an Owner promotes a member to Owner:
1. The target member becomes the new **Owner**
2. The current owner is auto-demoted to **Admin**
3. This happens atomically in a single database transaction
4. The new owner can now delete the workspace or manage all settings

### Multi-Tenancy Middleware Chain

Every protected API request passes through this chain:

```
authenticate → resolveTenant → requireMembership → requireRole → handler
```

1. `authenticate` — verifies JWT, extracts userId
2. `resolveTenant` — reads `x-tenant-id` header, validates UUID format
3. `requireMembership` — confirms user belongs to the tenant
4. `requireRole` — checks permission level (Owner > Admin > Member)
5. All queries scoped by `tenantId` — no cross-tenant data leakage

## API Endpoints

### Auth
| Method | Route                        | Auth | Description                        |
|--------|------------------------------|------|------------------------------------|
| POST   | `/api/auth/signup`           | No   | Create account + workspace (→ Owner)  |
| POST   | `/api/auth/login`            | No   | Login, returns JWT + workspaces + pending invites |
| POST   | `/api/auth/signup-with-invite` | No | Create account via invite token  |
| GET    | `/api/auth/me`               | Yes  | Current user + tenants + pending invites |
| DELETE | `/api/auth/delete-account`   | Yes  | Permanently delete user account + solo-owned workspaces |

### Tenants (requires auth + tenant header)
| Method | Route                  | Role         | Description      |
|--------|------------------------|--------------|------------------|
| GET    | `/api/tenants/current` | Any member   | Tenant details   |
| PATCH  | `/api/tenants/current` | Owner, Admin | Update tenant    |
| DELETE | `/api/tenants/current` | Owner        | Delete workspace (blocked if last workspace) |

### Members (requires auth + tenant header)
| Method | Route                           | Role         | Description         |
|--------|---------------------------------|--------------|---------------------|
| GET    | `/api/members`                  | Any member   | List members        |
| POST   | `/api/members/invite`           | Owner, Admin | Invite user         |
| POST   | `/api/members/accept-invite`    | Authed user  | Accept invite (transactional) |
| GET    | `/api/members/verify-invite/:token` | Public  | Verify invite + check account exists |
| PATCH  | `/api/members/:userId/role`     | Owner        | Change role (includes ownership transfer) |
| DELETE | `/api/members/:userId`          | Owner, Admin | Remove member       |

### Projects (requires auth + tenant header)
| Method | Route                | Role         | Description            |
|--------|----------------------|--------------|------------------------|
| GET    | `/api/projects`      | Any member   | List projects (paginated) |
| GET    | `/api/projects/:id`  | Any member   | Get project            |
| POST   | `/api/projects`      | Owner, Admin | Create project         |
| PATCH  | `/api/projects/:id`  | Owner, Admin | Update project         |
| DELETE | `/api/projects/:id`  | Owner, Admin | Delete project         |

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and set a real JWT_SECRET

# 4. Run database migrations
cd apps/api
npx prisma migrate dev --name init

# 5. Seed demo data
npx prisma db seed

# 6. Start development servers
cd ../..
npm run dev
```

The API runs on `http://localhost:4000` and the web app on `http://localhost:3000`.

### Demo Credentials

| Email              | Password      | Role  |
|--------------------|---------------|-------|
| owner@demo.com     | password123   | Owner |
| member@demo.com    | password123   | Member|

## Database Schema

```mermaid
erDiagram
    tenants ||--o{ memberships : has
    users ||--o{ memberships : has
    tenants ||--o{ projects : has
    tenants ||--o{ invites : has
    users ||--o{ invites : "invited by"

    tenants {
        uuid id PK
        string name
        string slug UK
        datetime created_at
        datetime updated_at
    }

    users {
        uuid id PK
        string email UK
        string name
        string password
        datetime created_at
        datetime updated_at
    }

    memberships {
        uuid id PK
        enum role "OWNER | ADMIN | MEMBER"
        uuid user_id FK
        uuid tenant_id FK
        datetime created_at
    }

    projects {
        uuid id PK
        string name
        string description
        uuid tenant_id FK
        datetime created_at
        datetime updated_at
    }

    invites {
        uuid id PK
        string email
        enum role "ADMIN | MEMBER"
        enum status "PENDING | ACCEPTED | EXPIRED"
        uuid tenant_id FK
        uuid invited_by_id FK
        datetime expires_at
    }
```

## Deployment

| Service  | Platform | URL |
|----------|----------|-----|
| Frontend | Vercel   | [saas-starter-kit-web.vercel.app](https://saas-starter-kit-web.vercel.app) |
| API      | Render   | [saas-starter-kit-lq3j.onrender.com](https://saas-starter-kit-lq3j.onrender.com) |
| Database | Neon     | PostgreSQL (serverless) |

## License

MIT
