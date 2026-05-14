# Authentication System Architecture Documentation

## Overview

The PRIBEC authentication system implements a **JWT-based authentication** with **refresh token rotation**, **role-based access control (RBAC)**, **multi-company context management**, **OAuth integration**, and **comprehensive session tracking**. The system is built on NestJS with PostgreSQL, Redis, and follows security best practices.

---

## 1. High-Level Authentication Architecture

```mermaid
graph TB
    Client[Client Application]
    
    subgraph apiGateway [API Gateway Layer]
        AuthController[Auth Controller]
        JwtAuthGuard[JWT Auth Guard]
        PermissionsGuard[Permissions Guard]
    end
    
    subgraph services [Service Layer]
        AuthService[Auth Service]
        UsersService[Users Service]
        SessionsService[Sessions Service]
        OAuthService[OAuth Verification Service]
        AuditService[Audit Service]
        NotificationService[Notification Service]
    end
    
    subgraph storage [Storage Layer]
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
    end
    
    Client -->|HTTP Request| AuthController
    AuthController --> AuthService
    AuthService --> UsersService
    AuthService --> SessionsService
    AuthService --> OAuthService
    AuthService --> AuditService
    AuthService --> NotificationService
    
    UsersService --> PostgreSQL
    SessionsService --> PostgreSQL
    AuditService --> PostgreSQL
    
    AuthService --> Redis
    JwtAuthGuard --> Redis
    
    JwtAuthGuard -->|Validates| Client
    PermissionsGuard -->|Authorizes| Client
```

**Key Components:**
- **Auth Controller** ([`apps/api/src/identity/auth/auth.controller.ts`](apps/api/src/identity/auth/auth.controller.ts)): HTTP endpoints for authentication
- **Auth Service** ([`apps/api/src/identity/auth/auth.service.ts`](apps/api/src/identity/auth/auth.service.ts)): Core authentication logic
- **JWT Strategy** ([`apps/api/src/identity/auth/jwt.strategy.ts`](apps/api/src/identity/auth/jwt.strategy.ts)): Passport JWT validation
- **Guards**: JwtAuthGuard (authentication) + PermissionsGuard (authorization)

---

## 2. User Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant UsersService
    participant Redis
    participant Database
    participant NotificationService
    participant AuditService
    
    Client->>AuthController: POST /auth/register
    AuthController->>AuthService: register(dto, context)
    
    AuthService->>UsersService: findByEmail(email)
    UsersService->>Database: SELECT * FROM identity.users
    Database-->>UsersService: null (not found)
    
    AuthService->>AuthService: bcrypt.hash(password, 12)
    AuthService->>UsersService: create(userData)
    UsersService->>Database: INSERT INTO identity.users
    Database-->>UsersService: user record
    
    AuthService->>UsersService: assignRole(userId, role)
    UsersService->>Database: INSERT INTO identity.user_roles
    
    AuthService->>AuthService: enrolInSelfCompany(userId)
    AuthService->>Database: INSERT INTO identity.company_members
    
    AuthService->>AuthService: Generate verification token
    AuthService->>Redis: SET auth:verify-email:token
    
    AuthService->>NotificationService: sendEmail(verification link)
    
    AuthService->>AuditService: log(user.registered)
    AuditService->>Database: INSERT INTO identity.audit_logs
    
    AuthService->>AuthService: issueTokens(userId)
    AuthService->>Database: INSERT INTO identity.refresh_tokens
    AuthService->>Redis: SET session:userId:tokenId
    
    AuthService-->>Client: user + tokens (access + refresh)
```

**Key Steps:**
1. Validate email not already registered
2. Hash password with bcrypt (cost factor: 12)
3. Create user record in `identity.users`
4. Assign default role (`buyer_seller`)
5. Auto-enrol in "Self" company (built-in system company)
6. Auto-accept any pending invitations for that email
7. Generate email verification token (stored in Redis, 60min TTL)
8. Send verification email
9. Audit log the registration
10. Issue JWT access token (15min) + refresh token (7 days)

---

## 3. Login Flow (Single Company)

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Redis
    participant Database
    participant SessionsService
    participant AuditService
    
    Client->>AuthController: POST /auth/login
    AuthController->>AuthService: login(credentials, context)
    
    AuthService->>Redis: GET auth:failed-login:IP
    Redis-->>AuthService: attempt count
    
    alt Too many attempts
        AuthService-->>Client: 429 Too Many Requests
    end
    
    AuthService->>Database: SELECT * FROM identity.users WHERE email
    Database-->>AuthService: user record
    
    AuthService->>AuthService: bcrypt.compare(password, hash)
    
    alt Invalid password
        AuthService->>Redis: INCR auth:failed-login:IP (TTL 15min)
        AuthService-->>Client: 401 Unauthorized
    end
    
    AuthService->>Redis: DEL auth:failed-login:IP
    AuthService->>Database: UPDATE last_login_at
    
    AuthService->>Database: SELECT roles FROM identity.user_roles
    Database-->>AuthService: roles array
    
    AuthService->>Database: SELECT company memberships
    Database-->>AuthService: memberships array
    
    alt Single company membership
        AuthService->>AuthService: issueTokens with company context
        AuthService->>Database: INSERT INTO identity.refresh_tokens
        AuthService->>SessionsService: create session
        SessionsService->>Database: INSERT INTO identity.user_sessions
        AuthService->>Redis: SET session:userId:tokenId
        
        AuthService->>AuditService: log(user.login)
        AuditService->>Database: INSERT INTO identity.audit_logs
        
        AuthService-->>Client: user + tokens
    end
```

**Security Features:**
- Rate limiting: 5 failed attempts → 15min lockout
- Failed attempts tracked in Redis by IP
- Passwords hashed with bcrypt (cost 12)
- Account status check (suspended/deleted accounts rejected)
- Audit logging of all login attempts

---

## 4. Login Flow (Multi-Company - Context Selection)

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Database
    
    Client->>AuthController: POST /auth/login
    AuthController->>AuthService: login(credentials)
    
    AuthService->>Database: Verify credentials
    AuthService->>Database: SELECT company memberships
    Database-->>AuthService: memberships array (length > 1)
    
    AuthService->>AuthService: issueTokens WITHOUT company context
    Note over AuthService: Interim token with active_company_id: null
    
    AuthService-->>Client: requires_context_selection: true<br/>user + interim tokens + companies list
    
    Client->>Client: Display company selector UI
    Client->>AuthController: POST /auth/contexts/select {company_id}
    AuthController->>AuthService: selectContext(userId, companyId)
    
    AuthService->>Database: Validate membership
    Database-->>AuthService: role + is_admin
    
    AuthService->>AuthService: issueTokens WITH company context
    Note over AuthService: Token with active_company_id embedded
    
    AuthService->>Database: INSERT INTO identity.audit_logs
    AuthService-->>Client: Final tokens with company context
```

**Multi-Company Support:**
- Users can belong to multiple companies with different roles
- Initial login returns interim token (no company context)
- Client must call `/auth/contexts/select` to choose company
- Final token embeds: `active_company_id`, `active_company_role`, `active_company_is_admin`
- Company context preserved across token refreshes

---

## 5. JWT Token Structure

```mermaid
graph TB
    subgraph accessToken [Access Token Payload]
        sub[sub: user UUID]
        email[email: user email]
        roles[roles: string array]
        kyc[kyc_status: approved/pending/null]
        companyId[active_company_id: UUID or null]
        companyRole[active_company_role: string or null]
        isAdmin[active_company_is_admin: boolean]
        sessionId[session_id: UUID]
    end
    
    subgraph expiry [Token Expiry]
        accessExp[Access: 15 minutes]
        refreshExp[Refresh: 7 days]
    end
    
    accessToken --> expiry
```

**JWT Payload Example:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "roles": ["contractor", "buyer_seller"],
  "kyc_status": "approved",
  "active_company_id": "123e4567-e89b-12d3-a456-426614174000",
  "active_company_role": "contractor",
  "active_company_is_admin": false,
  "session_id": "789e4567-e89b-12d3-a456-426614174111",
  "iat": 1709251200,
  "exp": 1709252100
}
```

**Storage:**
- Access token: Stored client-side only (memory/localStorage)
- Refresh token: Hashed (SHA-256) and stored in `identity.refresh_tokens`
- Session metadata: Stored in `identity.user_sessions` + Redis cache

---

## 6. Token Refresh Flow (Rotation)

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Database
    participant SessionsService
    participant Redis
    
    Client->>AuthController: POST /auth/refresh {refreshToken}
    AuthController->>AuthService: refresh(token, context)
    
    AuthService->>AuthService: hashToken(refreshToken)
    AuthService->>Database: SELECT FROM identity.refresh_tokens WHERE token_hash
    Database-->>AuthService: token row (with active_company_id)
    
    alt Invalid or expired token
        AuthService-->>Client: 401 Unauthorized
    end
    
    AuthService->>Database: UPDATE revoked_at = NOW() (old token)
    
    AuthService->>Database: Re-validate company membership
    Database-->>AuthService: Updated role + is_admin
    
    AuthService->>AuthService: issueTokens with preserved company context
    AuthService->>Database: INSERT INTO identity.refresh_tokens (new hash)
    
    AuthService->>SessionsService: rotate(oldHash, newInput)
    SessionsService->>Database: UPDATE identity.user_sessions
    Note over SessionsService: Updates hash in-place (same session row)
    
    AuthService->>Redis: SET session:userId:newTokenId
    
    AuthService->>Database: INSERT INTO identity.audit_logs (user.refresh)
    
    AuthService-->>Client: New access + refresh tokens
```

**Refresh Token Rotation:**
- Old refresh token is immediately revoked
- New refresh token issued with same company context
- Session row updated in-place (preserves device/IP metadata)
- Redis cache updated with new token mapping
- All refreshes are audit logged

---

## 7. Authentication Guard Flow

```mermaid
sequenceDiagram
    participant Client
    participant NestJS
    participant JwtAuthGuard
    participant JwtStrategy
    participant PermissionsGuard
    participant UsersService
    participant Controller
    
    Client->>NestJS: HTTP Request + Authorization: Bearer <token>
    NestJS->>JwtAuthGuard: canActivate()
    
    JwtAuthGuard->>JwtStrategy: validate(payload)
    JwtStrategy->>JwtStrategy: Verify JWT signature + expiry
    
    alt Invalid/expired token
        JwtStrategy-->>Client: 401 Unauthorized
    end
    
    JwtStrategy-->>JwtAuthGuard: JWT payload
    JwtAuthGuard->>NestJS: Attach user to request
    
    NestJS->>PermissionsGuard: canActivate()
    PermissionsGuard->>PermissionsGuard: Extract @Permissions decorator
    
    alt No permissions required
        PermissionsGuard-->>Controller: Allow
    end
    
    PermissionsGuard->>UsersService: getUserPermissions(userId)
    UsersService->>UsersService: Query role_permissions from DB
    UsersService-->>PermissionsGuard: permissions array
    
    PermissionsGuard->>PermissionsGuard: Check resource:action match
    
    alt Missing permissions
        PermissionsGuard-->>Client: 403 Forbidden
    end
    
    PermissionsGuard-->>Controller: Allow
    Controller-->>Client: Success response
```

**Guard Chain:**
1. **JwtAuthGuard** (Authentication)
   - Validates JWT signature and expiry
   - Extracts payload and attaches to `req.user`
   
2. **PermissionsGuard** (Authorization)
   - Reads `@Permissions` decorator metadata
   - Fetches user's effective permissions from database
   - Checks if user has required `resource:action` permissions
   - Supports wildcard `resource:full` for admin roles

**Usage Example:**
```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions({ resource: 'property', action: 'create' })
@Post('properties')
createProperty() { ... }
```

---

## 8. OAuth Login Flow (Google/Apple/Facebook)

```mermaid
sequenceDiagram
    participant Client
    participant OAuthProvider
    participant AuthController
    participant AuthService
    participant OAuthVerificationService
    participant UsersService
    participant Database
    
    Client->>OAuthProvider: Initiate OAuth flow
    OAuthProvider-->>Client: Provider token (id_token/access_token)
    
    Client->>AuthController: POST /auth/oauth/google {providerToken}
    AuthController->>AuthService: oauthLogin(provider, dto)
    
    AuthService->>OAuthVerificationService: verify(provider, token)
    OAuthVerificationService->>OAuthProvider: Verify token signature + claims
    OAuthProvider-->>OAuthVerificationService: Verified identity
    OAuthVerificationService-->>AuthService: email + firstName + lastName + emailVerified
    
    AuthService->>UsersService: findByEmail(email)
    UsersService->>Database: SELECT FROM identity.users
    
    alt User exists
        Database-->>UsersService: user record
    else User does not exist
        AuthService->>UsersService: create(email, no password)
        UsersService->>Database: INSERT INTO identity.users (password_hash: null)
        AuthService->>UsersService: assignRole(DEFAULT_ROLE)
        AuthService->>AuthService: enrolInSelfCompany()
        
        alt Provider confirmed email
            AuthService->>UsersService: markEmailVerified()
        end
    end
    
    AuthService->>Database: SELECT company memberships
    
    alt Multi-company
        AuthService-->>Client: requires_context_selection + companies
    else Single company
        AuthService->>AuthService: issueTokens with company context
        AuthService-->>Client: user + tokens
    end
```

**OAuth Providers Supported:**
- Google (`/auth/oauth/google`)
- Apple (`/auth/oauth/apple`)
- Facebook (`/auth/oauth/facebook`)

**OAuth-Specific Logic:**
- Users created via OAuth have `password_hash: null`
- Email automatically verified if provider confirms it
- Token verification delegates to [`oauth-verification.service.ts`](apps/api/src/identity/auth/oauth-verification.service.ts)

---

## 9. Password Reset Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Redis
    participant Database
    participant NotificationService
    
    Note over Client: Step 1: Request Reset
    Client->>AuthController: POST /auth/forgot-password {email}
    AuthController->>AuthService: forgotPassword(email)
    
    AuthService->>Database: SELECT user WHERE email
    
    alt User not found or suspended
        AuthService-->>Client: 200 OK (silent - no leak)
    end
    
    AuthService->>AuthService: Generate reset token (UUID)
    AuthService->>Redis: SET auth:password-reset:token (TTL 30min)
    
    AuthService->>NotificationService: sendEmail(reset link)
    AuthService->>Database: INSERT INTO identity.audit_logs
    AuthService-->>Client: 200 OK
    
    Note over Client: Step 2: Reset Password
    Client->>AuthController: POST /auth/reset-password {token, newPassword}
    AuthController->>AuthService: resetPassword(token, newPassword)
    
    AuthService->>Redis: GET auth:password-reset:token
    Redis-->>AuthService: {userId}
    
    alt Token invalid or expired
        AuthService-->>Client: 401 Unauthorized
    end
    
    AuthService->>AuthService: bcrypt.hash(newPassword)
    AuthService->>Database: UPDATE identity.users SET password_hash
    
    AuthService->>Redis: DEL auth:password-reset:token
    AuthService->>AuthService: revokeAllSessions(userId)
    AuthService->>Database: UPDATE identity.refresh_tokens SET revoked_at
    AuthService->>Redis: DEL all session:userId:* keys
    
    AuthService->>Database: INSERT INTO identity.audit_logs
    AuthService-->>Client: 200 OK
```

**Security Features:**
- Reset tokens stored in Redis with 30min TTL
- Silent success response (no email leak)
- All existing sessions revoked after password reset
- Audit logging of reset requests and completions

---

## 10. Email Verification Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Redis
    participant Database
    participant NotificationService
    
    Note over Client: During registration
    AuthService->>AuthService: Generate verification token (UUID)
    AuthService->>Redis: SET auth:verify-email:token (TTL 60min)
    AuthService->>NotificationService: sendEmail(verification link)
    
    Note over Client: User clicks email link
    Client->>AuthController: POST /auth/verify-email {token}
    AuthController->>AuthService: verifyEmail(token)
    
    AuthService->>Redis: GET auth:verify-email:token
    Redis-->>AuthService: {userId}
    
    alt Token invalid or expired
        AuthService-->>Client: 401 Unauthorized
    end
    
    AuthService->>Database: UPDATE identity.users SET email_verified_at = NOW()
    AuthService->>Redis: DEL auth:verify-email:token
    
    AuthService->>NotificationService: sendEmail(welcome message)
    AuthService->>Database: INSERT INTO identity.audit_logs
    AuthService-->>Client: 200 OK
```

**Email Verification:**
- Token valid for 60 minutes
- Stored in Redis: `auth:verify-email:{token}`
- Welcome email sent after successful verification
- Resend endpoint available: `/auth/resend-verification-email`

---

## 11. Session Management

```mermaid
graph TB
    subgraph sessionTracking [Session Tracking System]
        SessionsTable[(identity.user_sessions)]
        RefreshTokensTable[(identity.refresh_tokens)]
        RedisCache[(Redis Cache)]
    end
    
    subgraph sessionMetadata [Session Metadata]
        sessionId[Session ID]
        userId[User ID]
        tokenHash[Token Hash SHA-256]
        deviceName[Device Name]
        ipAddress[IP Address]
        countryCode[Country Code]
        lastActive[Last Active At]
        expiresAt[Expires At]
        revokedAt[Revoked At]
    end
    
    subgraph operations [Session Operations]
        Create[Create - New login]
        Rotate[Rotate - Token refresh]
        Revoke[Revoke - Logout]
        RevokeAll[Revoke All - Password change]
        List[List Active - User dashboard]
    end
    
    operations --> SessionsTable
    SessionsTable --> sessionMetadata
    sessionMetadata --> RedisCache
```

**Session Storage:**

**Database: `identity.user_sessions`**
- Persistent session records
- Tracks device, IP, country, last active time
- One row per session (updated during refresh rotation)

**Database: `identity.refresh_tokens`**
- Stores hashed refresh tokens
- Links to `user_sessions` via `session_token_hash`
- Tracks `active_company_id` for context preservation

**Redis Cache:**
- Key pattern: `session:{userId}:{refreshTokenId}`
- Stores session metadata for fast access
- TTL matches refresh token expiry (7 days)

**Session Service Operations:**
- `create()` - New session on login
- `rotate()` - Update session on token refresh (preserves session row)
- `revoke()` - Logout specific session
- `revokeAll()` - Logout all sessions (password change, suspension)
- `listActive()` - Show user their active sessions

Implementation: [`apps/api/src/identity/sessions/sessions.service.ts`](apps/api/src/identity/sessions/sessions.service.ts)

---

## 12. Database Schema

```mermaid
erDiagram
    users ||--o{ user_roles : has
    users ||--o{ refresh_tokens : owns
    users ||--o{ user_sessions : has
    users ||--o{ kyc_verifications : submits
    users ||--o{ audit_logs : generates
    users ||--o{ company_members : member_of
    
    roles ||--o{ user_roles : assigned_to
    roles ||--o{ role_permissions : grants
    permissions ||--o{ role_permissions : assigned_to
    
    companies ||--o{ company_members : contains
    
    users {
        uuid id PK
        varchar email UK
        varchar phone
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar status
        timestamptz email_verified_at
        timestamptz last_login_at
    }
    
    roles {
        uuid id PK
        varchar name UK
        varchar display_name
    }
    
    user_roles {
        uuid user_id FK
        uuid role_id FK
        uuid assigned_by FK
        timestamptz assigned_at
    }
    
    permissions {
        uuid id PK
        varchar resource
        varchar action
    }
    
    role_permissions {
        uuid role_id FK
        uuid permission_id FK
    }
    
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        varchar token_hash
        timestamptz expires_at
        timestamptz revoked_at
        uuid active_company_id
    }
    
    user_sessions {
        uuid id PK
        uuid user_id FK
        varchar session_token_hash
        varchar device_name
        inet ip_address
        timestamptz last_active_at
        timestamptz expires_at
        timestamptz revoked_at
    }
    
    companies {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_system
        varchar status
    }
    
    company_members {
        uuid company_id FK
        uuid user_id FK
        varchar role
        boolean is_admin
        jsonb permissions
        varchar status
    }
    
    kyc_verifications {
        uuid id PK
        uuid user_id FK
        varchar status
        text id_document_url
        uuid reviewer_id FK
    }
    
    audit_logs {
        uuid id PK
        varchar event_id
        uuid actor_id
        varchar action
        varchar resource_type
        uuid resource_id
        jsonb payload
        inet ip_address
    }
```

**Key Tables:**
- `identity.users` - User accounts
- `identity.roles` - 9 system roles (buyer_seller, agent, contractor, supplier, conveyancer, inspector, investor, admin, truck_operator)
- `identity.user_roles` - Many-to-many role assignments
- `identity.permissions` - Granular permissions (resource:action)
- `identity.role_permissions` - Role permission mappings
- `identity.refresh_tokens` - Hashed refresh tokens with company context
- `identity.user_sessions` - Session tracking with device/IP metadata
- `identity.companies` - Multi-company support (includes "Self" system company)
- `identity.company_members` - User-company memberships with role + permissions
- `identity.audit_logs` - Append-only audit trail

---

## 13. Role-Based Access Control (RBAC)

```mermaid
graph TB
    subgraph roles [System Roles]
        buyerSeller[buyer_seller]
        agent[agent]
        contractor[contractor]
        supplier[supplier]
        conveyancer[conveyancer]
        inspector[inspector]
        investor[investor]
        truckOperator[truck_operator]
        admin[admin]
    end
    
    subgraph permissions [Resource:Action Permissions]
        propertyRead[property:read]
        propertyCreate[property:create]
        projectCreate[project:create]
        escrowDeposit[escrow:deposit]
        escrowApprove[escrow:approve]
        usersManage[users:full]
        kycApprove[kyc:approve]
    end
    
    subgraph enforcement [Permission Enforcement]
        PermissionsGuard[Permissions Guard]
        PermissionsDecorator[@Permissions Decorator]
    end
    
    admin -->|full access| usersManage
    admin -->|full access| kycApprove
    admin -->|full access| escrowApprove
    
    agent -->|can create| propertyCreate
    contractor -->|can create| projectCreate
    buyerSeller -->|can deposit| escrowDeposit
    
    PermissionsDecorator --> PermissionsGuard
    PermissionsGuard --> permissions
```

**RBAC Permission Matrix:**

| Role | Property | Project | Escrow | Users | KYC |
|------|----------|---------|--------|-------|-----|
| **buyer_seller** | read | read | deposit | self | submit |
| **agent** | create/read/update | — | — | — | submit |
| **contractor** | read | create/update | — | — | submit |
| **supplier** | read | read | — | — | submit |
| **conveyancer** | read | — | read | — | submit |
| **inspector** | read | read | — | — | submit |
| **investor** | read | read | read | — | submit |
| **truck_operator** | — | — | — | — | submit |
| **admin** | full | full | full | full | approve |

**Implementation:**
- Permissions stored as `{resource: string, action: string}` in `identity.permissions`
- Role-permission mappings in `identity.role_permissions`
- Company members can have custom permissions in `company_members.permissions` (JSONB)
- Permissions enforced via `@Permissions` decorator + `PermissionsGuard`

**Usage Example:**
```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions({ resource: 'escrow', action: 'approve' })
@Post('escrow/:id/approve')
approveEscrow() { ... }
```

---

## 14. Security Measures

```mermaid
mindmap
    root((Security))
        Authentication
            JWT signed with HS256
            Access token 15min expiry
            Refresh token 7 days
            Token rotation on refresh
            Tokens revoked on password change
        
        Password Security
            bcrypt hashing cost factor 12
            Min 8 characters enforced
            No plaintext storage
            Rate limiting on login
        
        Rate Limiting
            10 req/min on auth endpoints
            5 failed login attempts lockout
            15min lockout duration
            IP-based tracking in Redis
        
        Session Security
            Refresh tokens hashed SHA-256
            Session metadata tracked
            Device fingerprinting
            IP address logging
            Country code detection
        
        Audit Logging
            All auth events logged
            Append-only audit table
            IP address captured
            User agent captured
            Device metadata captured
        
        Multi-Factor Auth
            MFA config service available
            TOTP support ready
            SMS verification ready
```

**Security Configuration:**

**Password Security:**
- Bcrypt hashing with cost factor 12
- Minimum 8 characters enforced (configurable)
- Password validation on register/reset

**Token Security:**
- JWT signed with `JWT_SECRET` (HS256)
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Refresh tokens hashed (SHA-256) before storage
- Old refresh tokens immediately revoked on rotation

**Rate Limiting:**
- Auth endpoints: 10 requests/min (via `@Throttle` decorator)
- Failed logins: 5 attempts → 15min lockout
- Lockout tracked in Redis by IP address

**Session Security:**
- Device name, IP address, country code tracked
- Session activity timestamps
- Admin can view/revoke active sessions
- All sessions revoked on password change

**Audit Logging:**
- Every auth event logged to `identity.audit_logs`
- Captured: actor, action, resource, payload, IP, user agent
- Append-only table (no UPDATE/DELETE)
- Events: `user.registered`, `user.login`, `user.logout`, `user.refresh`, `user.password_reset_requested`, `user.password_reset_completed`, `kyc.approved`, etc.

---

## 15. API Endpoints Reference

**Authentication:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - Password login (returns tokens or context selector)
- `POST /api/v1/auth/logout` - Logout (revoke refresh token)
- `POST /api/v1/auth/refresh` - Refresh access token (rotates refresh token)

**Password Management:**
- `POST /api/v1/auth/forgot-password` - Request password reset email
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/change-password` - Change password (requires current password)

**Email Verification:**
- `POST /api/v1/auth/verify-email` - Verify email with token
- `POST /api/v1/auth/resend-verification-email` - Resend verification email

**OAuth:**
- `POST /api/v1/auth/oauth/google` - Google OAuth login
- `POST /api/v1/auth/oauth/apple` - Apple OAuth login
- `POST /api/v1/auth/oauth/facebook` - Facebook OAuth login

**Company Context (Multi-Company):**
- `GET /api/v1/auth/contexts` - List user's company memberships
- `POST /api/v1/auth/contexts/select` - Select active company context

**All auth endpoints rate-limited to 10 requests/minute.**

---

## 16. Environment Configuration

Required environment variables ([`.env.example`](.env.example)):

```bash
# JWT Configuration
JWT_SECRET=<32+ character secret>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Password Security
BCRYPT_ROUNDS=12

# Token Expiry
EMAIL_VERIFICATION_TOKEN_EXPIRY_MINUTES=60
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=30

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgres://...

# Redis
REDIS_URL=redis://...

# Sentry (optional)
SENTRY_DSN=
```

---

## 17. Key Files Reference

**Core Authentication:**
- [`apps/api/src/identity/auth/auth.service.ts`](apps/api/src/identity/auth/auth.service.ts) - Main authentication logic (1112 lines)
- [`apps/api/src/identity/auth/auth.controller.ts`](apps/api/src/identity/auth/auth.controller.ts) - HTTP endpoints
- [`apps/api/src/identity/auth/jwt.strategy.ts`](apps/api/src/identity/auth/jwt.strategy.ts) - JWT validation strategy
- [`apps/api/src/identity/auth/auth.types.ts`](apps/api/src/identity/auth/auth.types.ts) - Type definitions

**Guards & Authorization:**
- [`apps/api/src/identity/rbac/jwt-auth.guard.ts`](apps/api/src/identity/rbac/jwt-auth.guard.ts) - Authentication guard
- [`apps/api/src/identity/rbac/permissions.guard.ts`](apps/api/src/identity/rbac/permissions.guard.ts) - Authorization guard

**Session Management:**
- [`apps/api/src/identity/sessions/sessions.service.ts`](apps/api/src/identity/sessions/sessions.service.ts) - Session CRUD operations

**OAuth:**
- [`apps/api/src/identity/auth/oauth-verification.service.ts`](apps/api/src/identity/auth/oauth-verification.service.ts) - OAuth token verification

**Database Migrations:**
- `apps/api/prisma/migrations/202602210001_sprint02_identity_auth/migration.sql` - Auth tables
- `apps/api/prisma/migrations/202603050013_sprint02_enhanced/migration.sql` - Sessions table

**Sprint Specification:**
- [`design/sprints/sprint-02-identity-auth.md`](design/sprints/sprint-02-identity-auth.md) - Full sprint requirements

---

This comprehensive documentation covers the complete authentication architecture with all flows, security measures, and implementation details.
