# MotorCare — Motorcycle Maintenance & Service Tracker

MotorCare is a modern automotive web application built for motorcycle owners to maintain digital records of their motorcycles, recurring maintenance intervals, service logs, operating expenses, and maintenance health scores.

---

## 🌟 Key Features

1. **Multi-Motorcycle Garage**:
   - Manage multiple motorcycles with brand, model, year, nickname, plate number, and odometer.
   - Dynamic health score calculation per motorcycle.
   - Safe cascading deletion with confirmation dialogs.

2. **Automated Recurring Maintenance Schedules**:
   - Set recurring maintenance intervals based on kilometers (e.g. Oil Change every 1,000 km, Chain Service every 500 km, Brake Inspection every 2,000 km) and optional time (days).
   - Real-time status badges:
     - 🟢 **Up to Date**
     - 🟡 **Due Soon**
     - 🟠 **Due Now**
     - 🔴 **Overdue**
   - Visual progress bars showing percentage of interval consumed.
   - 1-click restore for manufacturer-style recommended defaults.

3. **Maintenance Health Score (0–100)**:
   - Deterministic and explainable health score calculated from active maintenance schedules.
   - Summarizes overall fleet condition without misleading mechanical diagnostic claims.

4. **Service Records & Unified History**:
   - Log service events: Oil Change, Engine Service, Brake Service, Chain & Sprocket, Tyres, Battery, Suspension, Inspection, etc.
   - Automatically synchronizes motorcycle odometer if service mileage exceeds current mileage.
   - Automatically marks matching maintenance schedule intervals as completed.
   - Chronological unified timeline combining service and expense records.

5. **Expense Tracking & Analytics**:
   - Categorize operating costs: Fuel, Parts, Accessories, Insurance, Registration, Maintenance, and Other.
   - Monthly spending trend charts and expense category breakdown.

6. **Authentication & Security**:
   - Google Sign-In with Firebase Authentication (popup mode).
   - Credentials-based registration and login with bcrypt password hashing and JWT sessions.
   - Instant 1-click demo login (`demo@motorcare.local`).
   - Every database query is strictly scoped to the authenticated user ID to prevent unauthorized cross-user data access.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, tsx.
- **Database**: PostgreSQL (Google Cloud SQL) via connection pooling (`pg` Pool).
- **ORM & Migrations**: Drizzle ORM, Drizzle Kit.
- **Authentication**: Firebase Auth (Admin SDK + Client SDK) & JSON Web Tokens with bcryptjs.
- **Validation**: Zod schema validation on all inputs.

---

## 📁 Project Structure

```text
├── server.ts                   # Express server entry point mounting API routes and Vite middleware
├── src/
│   ├── components/
│   │   ├── layout/Navbar.tsx   # Responsive desktop sidebar & mobile drawer
│   │   ├── ui/                 # Reusable UI components (Modal, ConfirmDialog, StatCard, etc.)
│   │   ├── motorcycles/        # Add & Edit Motorcycle modals
│   │   ├── services/           # Log Service Record modal
│   │   ├── maintenance/        # Add Maintenance Schedule modal
│   │   └── expenses/           # Add Expense modal
│   ├── context/
│   │   ├── AuthContext.tsx     # User auth session & API client
│   │   └── ToastContext.tsx    # Toast notification system
│   ├── db/
│   │   ├── schema.ts           # PostgreSQL tables & relations
│   │   ├── index.ts            # PostgreSQL connection pool & Drizzle ORM
│   │   ├── drizzle.config.ts   # Drizzle Kit admin migration configuration
│   │   └── users.ts            # User synchronization queries
│   ├── lib/
│   │   ├── calculations.ts     # Maintenance status & health scoring logic
│   │   ├── validation.ts       # Zod input validation schemas
│   │   ├── firebase.ts         # Client Firebase Auth initialization
│   │   └── firebase-admin.ts   # Server Firebase Admin token verification
│   ├── middleware/
│   │   └── auth.ts             # Auth middleware verifying JWT or Firebase tokens
│   ├── server/
│   │   ├── routes/             # Express API routers (auth, motorcycles, services, etc.)
│   │   └── db-operations.ts    # User-scoped database operations
│   ├── views/                  # Primary application views (Dashboard, Garage, Detail, etc.)
│   └── App.tsx                 # Root application shell
└── package.json
```

---

## 🔑 Environment Variables

The following environment variables are configured in `.env.example`:

```bash
# Cloud SQL PostgreSQL runtime credentials
SQL_HOST="localhost"
SQL_USER="my_user"
SQL_PASSWORD="my_password"
SQL_DB_NAME="my_db"
SQL_ADMIN_USER="my_admin"
SQL_ADMIN_PASSWORD="my_admin_password"

# Credentials session secret
AUTH_SECRET="your-development-jwt-secret-min-32-chars"
```

---

## 🚀 How to Run the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Push Database Schema
```bash
npx drizzle-kit push
```

### 3. Run in Development
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 👤 Demo User Credentials

For testing and local development, you can use the pre-seeded demo user:
- **Email**: `demo@motorcare.local`
- **Password**: `password123`

Or simply click the **"Quick Demo Login"** button on the sign-in page to log in immediately with sample motorcycles (Honda CB150F and Yamaha MT-07).
