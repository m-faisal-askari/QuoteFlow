# QuoteFlow

QuoteFlow is a full-stack invoice and quotation management application engineered for freelancers, consultancies, agencies, and small businesses.

Built with a **React 18 (Vite)** frontend and a **Node.js/Express** backend backed by **Neon PostgreSQL** and **Prisma ORM**.

---

## Features

- **Public SaaS Landing Page** &mdash; High-contrast, non-generic homepage showcasing live document simulation, architectural breakdown, and quick access.
- **Sequential Auto-Increment Engine** &mdash; Monotonic, collision-proof sequence numbers (`QT-0001`, `INV-0001`) enforced via PostgreSQL database constraints.
- **Document Status State Machine** &mdash; Update quotation and invoice statuses directly from table views with dedicated atomic `PATCH` endpoints.
- **Direct PDF Streaming** &mdash; Server-side A4 PDF document generation streaming directly to the browser with zero redirects or print popups.
- **1-Click Quotation Conversion** &mdash; Seamlessly convert accepted proposals into active invoices without re-entering client data or line items.
- **Payment & Settlement Ledger** &mdash; Record multiple payment methods (Wire, Credit Card, Check, Cash) with real-time remaining balance calculations.
- **Customer CRM** &mdash; Complete client directory with snapshot integrity across generated documents.
- **Company Branding & Logo** &mdash; Configure tax ID, payment terms, currency defaults, and custom business logos.
- **Session-Based Authentication** &mdash; Secure cookie session authentication using `express-session` and `connect-pg-simple` stored in Neon PostgreSQL.

---

## Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Single-page application with modular styling |
| **Routing** | React Router v6 | Public landing page at `/`, dashboard at `/dashboard` |
| **Icons** | Lucide React | Modern, lightweight UI iconography |
| **Styling** | CSS Modules | Encapsulated, component-scoped styles |
| **Backend** | Node.js, Express.js | REST API with input validation & centralized error handling |
| **Database** | Neon PostgreSQL | Cloud-hosted serverless PostgreSQL with ACID compliance |
| **ORM** | Prisma ORM | Type-safe migrations, models, and query execution |
| **Session Store** | `connect-pg-simple` | Persistent PostgreSQL sessions table (`user_sessions`) |
| **Password Security** | `bcryptjs` | Salted 10-round password hashing |
| **PDF Engine** | PDFKit | Clean A4 invoice and quotation rendering pipeline |

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm 9+
- A cloud PostgreSQL database URL (e.g. [Neon](https://neon.tech))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/m-faisal-askari/QuoteFlow.git
   cd QuoteFlow
   ```

2. **Install all dependencies:**
   ```bash
   # Install root concurrently runner
   npm install

   # Install backend dependencies
   npm install --prefix server

   # Install frontend dependencies
   npm install --prefix client
   ```

3. **Configure environment variables:**

   Copy the provided `.env.example` templates:

   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Update `server/.env` with your Neon PostgreSQL connection string and a secure session secret:
   ```env
   DATABASE_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
   SESSION_SECRET="your-secure-random-session-secret"
   PORT=3001
   NODE_ENV=development
   CLIENT_URL="http://localhost:5173"
   ```

4. **Deploy database migrations:**
   ```bash
   cd server
   npx prisma migrate deploy
   ```

5. **(Optional) Seed realistic dummy data:**
   ```bash
   npm run db:seed --prefix server
   ```

6. **Start development servers:**
   ```bash
   # Concurrently run both client and server:
   npm run dev

   # Or run independently:
   npm run dev:server   # Express API on http://localhost:3001
   npm run dev:client   # Vite Frontend on http://localhost:5173
   ```

---

## Project Structure

```
QuoteFlow/
├── client/                     # React frontend (Vite)
│   ├── public/
│   │   ├── quoteflow-icon.svg  # Application logo & favicon
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/client.js       # Authenticated API client & blob downloader
│   │   ├── components/         # Reusable UI components & layouts
│   │   ├── context/            # AuthContext & ToastContext
│   │   ├── pages/              # Home, Dashboard, Quotations, Invoices, Customers
│   │   ├── styles/             # Component-scoped CSS modules
│   │   └── utils/              # Calculation helpers & formatters
│   ├── index.html              # HTML shell linking QuoteFlow icon
│   └── vite.config.js
├── server/                     # Express backend
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL Prisma schema
│   │   ├── migrations/         # PostgreSQL migration history
│   │   └── seed.js             # Realistic dummy data generator
│   ├── src/
│   │   ├── config/             # Database & environment configuration
│   │   ├── middleware/         # Session auth, validation, error handler
│   │   ├── routes/             # REST endpoints (auth, quotations, invoices, pdf)
│   │   └── utils/              # PDFKit document generator
│   └── uploads/                # User logo uploads directory (.gitkeep)
├── .env.example                # Root environment template
├── .gitignore                  # Production-grade Git ignore rules
└── package.json                # Project workspace configuration
```

---

## API Reference

### Authentication
- `POST /api/auth/register` &mdash; Create a new user account
- `POST /api/auth/login` &mdash; Authenticate and create session
- `POST /api/auth/logout` &mdash; Invalidate session cookie
- `GET /api/auth/me` &mdash; Fetch current session profile

### Quotations
- `GET /api/quotations` &mdash; List quotations (filterable by status/search)
- `POST /api/quotations` &mdash; Create sequential quotation with line items
- `GET /api/quotations/:id` &mdash; Retrieve quotation details
- `PUT /api/quotations/:id` &mdash; Update quotation details and line items
- `PATCH /api/quotations/:id/status` &mdash; Dedicated status transition endpoint
- `DELETE /api/quotations/:id` &mdash; Delete unconverted quotation
- `POST /api/quotations/:id/convert` &mdash; Convert quotation to active invoice

### Invoices & Payments
- `GET /api/invoices` &mdash; List invoices with balance tallies
- `POST /api/invoices` &mdash; Create sequential invoice
- `GET /api/invoices/:id` &mdash; Retrieve invoice with line items & payment history
- `PUT /api/invoices/:id` &mdash; Update invoice
- `PATCH /api/invoices/:id/status` &mdash; Dedicated status transition endpoint
- `DELETE /api/invoices/:id` &mdash; Delete invoice and associated payments
- `POST /api/invoices/:id/payments` &mdash; Record incoming payment & recalculate balance
- `DELETE /api/payments/:id` &mdash; Remove payment record

### PDF Engine
- `GET /api/pdf/quotation/:id` &mdash; Stream quotation PDF as attachment download
- `GET /api/pdf/invoice/:id` &mdash; Stream invoice PDF as attachment download

### Customers & Settings
- `GET /api/customers` &bull; `POST /api/customers` &mdash; Customer management
- `GET /api/company` &bull; `PUT /api/company` &mdash; Company profile & numbering settings
- `POST /api/company/logo` &mdash; Upload company branding image
- `GET /api/dashboard` &mdash; Aggregated revenue, receivables, and recent activity metrics

---

## License

MIT License &copy; QuoteFlow Inc.
