# 🛠️ ServiceHub India — Hyperlocal & Rural On-Demand Services Marketplace

> A production-grade, full-stack marketplace connecting households, farmers, and businesses across Indian cities, talukas, and rural districts with verified service technicians, backed by a **Safety-First Home Emergency Help** triage system.

---

## 🌟 Overview

**ServiceHub India** is engineered to address the unique service demands of India's mixed urban and rural economies. Beyond traditional urban home services (cleaning, electrician, plumbing, appliance repair), ServiceHub directly supports agricultural and rural infrastructure — including solar irrigation pump servicing, tractor and harvester machinery hire, borewell diagnostics, and micro-drip irrigation.

### Key Highlights
- 🚨 **Safety-First Home Emergency Help**: Immediate, unauthenticated safety guidance and official helpline access (LPG Emergency Helpline **1906**, National Emergency **112**) for gas leaks, electrical sparking, burst pipes, and fire/smoke. Optional dispatch to approved local repair specialists.
- 🔄 **Real-Time Booking & Dispatch Lifecycle**: End-to-end booking lifecycle (`PENDING` ➔ `ACCEPTED` / `REJECTED` ➔ `IN_PROGRESS` ➔ `COMPLETED`) with automated status updates, notifications, and provider response tracking.
- 🛡️ **Trust & Verification (RBAC)**: Role-Based Access Control across three distinct user roles: **Customer**, **Service Provider**, and **Administrator**. Includes Aadhaar verification badges, trade license validation, and verified customer reviews.
- ⚡ **Unified Full-Stack Architecture**: Single-port Express + Vite development setup (`PORT 3000`), SQLite persistent relational database via `better-sqlite3`, and modern React 19 UI styled with Tailwind CSS v4.

---

## 👥 Demo Personas (Pre-Seeded)

The database automatically seeds on first launch. You can log in using these credentials or click the **Demo Accounts** switchers inside the login modal:

| Role | Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Pooja Sharma | `customer@servicehub.in` | `Customer@123` | Browse listings, book appointments, track requests live, submit ratings & reviews, report household emergencies. |
| **Service Provider** | Rameshwar Patil (*Kisan Agro & Solar Tech*) | `rameshwar@kisanmitra.in` | `Pro@123` | Manage service catalogue, accept/reject incoming bookings, claim emergency repair calls, update job status. |
| **Administrator** | ServiceHub Admin | `admin@servicehub.in` | `Admin@123` | Platform analytics, approve/verify provider Aadhaar & licenses, manage categories, supervise urgent repair dispatches. |

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend                        │
│   (Vite SPA + Tailwind CSS v4 + Lucide Icons + Context API) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    Express 4 Backend                        │
│    (Mounted on Port 3000, Vite Dev Middleware in Dev Mode)   │
├─────────────────────────────────────────────────────────────┤
│  • JWT Auth & bcryptjs       • RBAC Permission Guards       │
│  • Emergency Triage Engine   • Booking State Machine        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Relational Foreign Keys
┌──────────────────────────────▼──────────────────────────────┐
│                 SQLite Database Engine                      │
│     (better-sqlite3 with Auto-Migrations & Indexed Tables)  │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React icons.
- **Backend**: Node.js, Express 4.21, `tsx` TypeScript runtime, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`.
- **Database**: SQLite 3 via `better-sqlite3` (with WAL mode, foreign keys, and indexes on `bookings`, `emergency_requests`, `users`, and `services`).

---

## 🚨 Safety-First Home Emergency Help Workflow

The **Emergency Help** feature is permanently accessible from the top navigation bar and customer dashboard:

1. **Zero-Barrier Access**:
   - Does **not** require login, registration, location permissions, or payment before displaying critical safety instructions and official helpline numbers.
   - Remains completely accessible offline or in low-connectivity situations through cached emergency protocols.
2. **Authoritative Incident Guidance**:
   - **Suspected LPG Leak**: Explicit warnings against operating electrical switches, using open flames, or performing DIY repairs. Prominently displays India's **1906** All-India 24x7 LPG Helpline and **112** National Emergency.
   - **Electrical Sparking / Burning Smell**: Guidance on switching off the main MCB/isolator, avoiding wet floors, and emergency isolations.
   - **Burst Water Pipes / Flooding**: Advises turning off the main overhead valve or municipal stopcock, and warning against touching submerged electrical plugs.
   - **Fire & Heavy Smoke**: Advises instant evacuation, warning neighbors, avoiding elevators, and calling **112** / **101**.
3. **Honest Marketplace Repair Assistance**:
   - Customers may optionally submit an urgent repair request after reviewing safety protocols.
   - The platform never fabricates response times or claims a technician is dispatched until an active, verified professional explicitly accepts the ticket.

---

## 📋 Key Modules & Features

### 1. Customer Experience
- **Location & Category Filtering**: Browse services across Home & Deep Cleaning, Electrician & Wiring, Agro Machinery & Tractor Hire, Solar Pump & Panel Repair, Rural Plumbing & Borewell, and Appliance Repair.
- **Localized Booking Form**: Choose preferred dates, customizable time slots, on-site or travel modes, and exact farm/house address.
- **Live Booking Tracker**: Visual status bar (`Pending` ➔ `Accepted` ➔ `In Progress` ➔ `Completed` / `Rejected`).
- **Verified Reviews**: Post 1-5 star ratings and feedback once an appointment is marked `COMPLETED`.

### 2. Service Provider Dashboard
- **Request Management**: Real-time view of incoming booking requests with detailed customer notes, location, and preferred time.
- **One-Click Accept / Reject**: Updates the booking status, timestamps the provider's response, and notifies the client instantly.
- **Emergency Repair Queue**: Inspect and accept nearby urgent repair calls in the provider's district.
- **Service Listings Manager**: Add, edit, and toggle active status on custom service offerings with transparent INR pricing models (per visit, per hour, per acre, per point).
- **Business Profile**: Update trade certifications, bio, service areas, and language proficiencies.

### 3. Administrator Console
- **Platform Analytics**: Total revenue, platform bookings, active service listings, and provider counts.
- **Verification Desk**: Review provider submissions, inspect trade license numbers, and grant the **Verified Pro Badge** and **Aadhaar Verified** status.
- **Emergency Monitor**: Oversight of all high-severity household and agricultural repair tickets, tracking open vs. resolved status across districts.
- **Category Taxonomy**: Add and categorize marketplace sectors (`HOME`, `AGRI_RURAL`, `ELECTRONICS`, `COMMUNITY`).

---

## 🔌 API Endpoints Reference

All API routes are served under the `/api` prefix:

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new Customer or Service Provider |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive 7-day JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session user, profile, & unread count |
| `PUT` | `/api/auth/profile` | Authenticated | Update user name, phone, or provider business details |

### 📂 Categories & Services (`/api/categories`, `/api/services`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | List all active marketplace service categories |
| `POST` | `/api/categories` | Admin | Create a new service category |
| `GET` | `/api/services` | Public | List services with optional category, search, & provider filters |
| `GET` | `/api/services/:id` | Public | Get detailed service listing including provider profile & reviews |
| `POST` | `/api/services` | Provider | Create a new service listing |
| `PUT` | `/api/services/:id` | Provider / Admin | Update an existing service listing |
| `DELETE` | `/api/services/:id` | Provider / Admin | Remove a service listing |

### 📅 Bookings Lifecycle (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings` | Authenticated | Fetch bookings relevant to current user (customer, provider, or admin) |
| `GET` | `/api/bookings/:id` | Authenticated | Fetch single booking detail |
| `POST` | `/api/bookings` | Customer | Submit a new booking request in `PENDING` status |
| `PATCH` | `/api/bookings/:id/status` | Provider / Admin / Customer | Update status (`ACCEPTED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) |

### 🚨 Emergency Requests (`/api/emergency`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/emergency` | Authenticated | List emergency repair requests filtered by role & permissions |
| `GET` | `/api/emergency/:id` | Authenticated | Get single emergency request details |
| `POST` | `/api/emergency` | Public / Customer | Create an urgent household emergency assistance request |
| `POST` | `/api/emergency/:id/accept` | Provider | Provider accepts an open emergency repair request |
| `PATCH` | `/api/emergency/:id/status` | Provider / Admin | Update resolution status (`IN_PROGRESS`, `RESOLVED`, `CANCELLED`) |

### ⭐ Reviews & Notifications (`/api/reviews`, `/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Customer | Post a rating and review for a completed booking |
| `GET` | `/api/notifications` | Authenticated | Get user notifications |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| `POST` | `/api/notifications/mark-all-read` | Authenticated | Mark all notifications as read |

### 🛡️ Admin Operations (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Platform overview metrics & totals |
| `GET` | `/api/admin/providers` | Admin | Provider directory with verification statuses |
| `PATCH` | `/api/admin/providers/:id/verify` | Admin | Approve or reject provider verification and badge |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

### Installation & Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application starts on **`http://localhost:3000`** (serving both the Express API and Vite React client).

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Run type-check / lint**:
   ```bash
   npm run lint
   ```

---

## 📁 Project Structure

```
├── server.ts                    # Full-stack server entry point (Express + Vite middlewares)
├── server/
│   ├── api.ts                   # REST API routes (Auth, Services, Bookings, Emergency, Admin)
│   └── db.ts                    # SQLite database schema, indexes, and Indian marketplace seed
├── src/
│   ├── assets/                  # High-quality optimized category & banner imagery
│   ├── components/
│   │   ├── AuthModal.tsx        # Login & registration modal with quick demo persona switcher
│   │   ├── BookingModal.tsx     # Scheduling modal with slot selector and live status tracker
│   │   ├── EmergencyHelpModal.tsx # Safety-first emergency triage, 1906/112 dialer & repair dispatch
│   │   ├── Navbar.tsx           # Global header with emergency badge, role switchers & navigation
│   │   ├── NotificationsModal.tsx # Notification center
│   │   ├── ReviewModal.tsx      # Post-service customer rating & review modal
│   │   └── Footer.tsx           # Footer with safety guarantees & quick links
│   ├── context/
│   │   └── AuthContext.tsx      # JWT session management & demo account fast-switching
│   ├── lib/
│   │   └── api.ts               # Type-safe client API wrapper communicating with /api/*
│   ├── pages/
│   │   ├── HomePage.tsx         # Hero section, emergency CTA, popular categories, featured pros
│   │   ├── BrowseServicesPage.tsx # Service search, category filters, and location filtering
│   │   ├── CategoriesPage.tsx   # Categorized directory of home & agro services
│   │   ├── CustomerDashboard.tsx # Client booking manager, emergency tickets, profile settings
│   │   ├── ProviderDashboard.tsx # Pro workspace for bookings, emergency requests, & listings
│   │   ├── AdminDashboard.tsx   # Admin dashboard for platform metrics & provider verification
│   │   ├── ServiceDetailPage.tsx # Comprehensive service specs, provider credentials, reviews
│   │   ├── ProviderProfilePage.tsx # Public provider profile with badges, skills, & services
│   │   ├── HowItWorksPage.tsx   # Visual customer & provider walkthrough
│   │   ├── TrustAndSafetyPage.tsx # Aadhaar verification, fair pricing & emergency safety pledge
│   │   ├── ContactPage.tsx      # Support and helpdesk contact details
│   │   └── TermsPrivacyPage.tsx # Terms of service and privacy policies
│   ├── types.ts                 # Shared TypeScript models and interfaces
│   ├── App.tsx                  # Main app navigation and modal orchestration
│   ├── main.tsx                 # React DOM mount point
│   └── index.css                # Tailwind CSS v4 directives
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Security & Data Integrity

- **Password Security**: Passwords are securely hashed with `bcryptjs` (salt rounds: 10).
- **JWT Authentication**: Secured tokens with expiration checking and role verification middleware (`requireRole`).
- **SQL Injection Prevention**: 100% prepared statements via `better-sqlite3` parameterized queries.
- **Integrity Constraints**: Database foreign keys with strict referential actions (`ON DELETE CASCADE` / `ON DELETE RESTRICT`), and indexed lookup fields.
- **Authoritative Safety Compliance**: Zero generative AI hallucinations in emergency safety steps; verified real helplines (**1906** LPG emergency helpline, **112** national emergency).
