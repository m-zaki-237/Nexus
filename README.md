# Nexus — Startup Networking Platform

> Connecting entrepreneurs and investors in one place. Nexus is a full-stack MERN web application that bridges the gap between startup founders and investors through real-time messaging, collaboration requests, document sharing, meeting scheduling, and Stripe-powered subscription plans.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
  - [Seeding the Database](#seeding-the-database)
- [API Reference](#api-reference)
- [Subscription Plans](#subscription-plans)
- [Contributing](#contributing)
- [Author](#author)

---

## Features

- **Role-based Authentication** — Separate flows for Entrepreneurs and Investors with JWT + cookie sessions
- **Dual Dashboards** — Tailored dashboards per role with relevant stats and quick actions
- **Discover Network** — Browse and filter entrepreneur and investor profiles
- **Collaboration Requests** — Send, receive, and manage partnership requests
- **Real-time Messaging** — One-on-one chat powered by Socket.IO with online presence indicators
- **Meeting Scheduler** — Schedule, view, and manage meetings between parties
- **Document Management** — Upload, share, sign, and delete business documents via Multer
- **Stripe Subscriptions** — Free and Pro plans with Stripe Checkout, Customer Portal, and webhook handling
- **Profile Management** — Rich profiles including startup details, funding needs, investment interests, and portfolio companies
- **Notifications** — In-app notification system for platform activity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 |
| State / Auth | React Context API |
| UI Icons | Lucide React |
| HTTP Client | Axios |
| Real-time | Socket.IO Client |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs, cookie-parser |
| File Uploads | Multer |
| Payments | Stripe |
| Dev Tools | Nodemon, ESLint |

---

## Project Structure

```
Nexus/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── collaborationRequest.controller.js
│   │   ├── meeting.controller.js
│   │   ├── document.controller.js
│   │   ├── message.controller.js
│   │   └── payment.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js      # JWT verification
│   ├── models/
│   │   ├── user.model.js
│   │   ├── message.model.js
│   │   └── ...
│   ├── routes/
│   │   ├── user.route.js
│   │   ├── collaborationRequest.route.js
│   │   ├── meeting.route.js
│   │   ├── document.route.js
│   │   ├── message.route.js
│   │   └── payment.route.js
│   ├── seeders/
│   │   └── userSeeder.js
│   └── index.js                   # App entry, Socket.IO setup
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── layout/
│       │       └── DashboardLayout.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── pages/
│       │   ├── auth/              # Login, Register
│       │   ├── dashboard/         # EntrepreneurDashboard, InvestorDashboard
│       │   ├── profile/           # EntrepreneurProfile, InvestorProfile
│       │   ├── investors/
│       │   ├── entrepreneurs/
│       │   ├── messages/
│       │   ├── chat/
│       │   ├── meetings/
│       │   ├── documents/
│       │   ├── deals/
│       │   ├── pricing/
│       │   ├── notifications/
│       │   ├── settings/
│       │   └── help/
│       ├── App.tsx
│       └── main.tsx
│
└── package.json                   # Root workspace scripts
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A [Stripe](https://stripe.com) account (for payment features)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/m-zaki-237/Nexus.git
cd Nexus
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/nexus

# Auth
JWT_SECRET=your_jwt_secret_key

# Client
CLIENT_URL=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

> **Note:** Never commit your `.env` file. Add it to `.gitignore`.

### Running the App

Open two terminals:

**Backend** (runs on `http://localhost:5000`)

```bash
cd backend
npm run dev
```

**Frontend** (runs on `http://localhost:5173`)

```bash
cd frontend
npm run dev
```

### Seeding the Database

Populate the database with sample entrepreneurs and investors:

```bash
cd backend
npm run seed
```

---

## API Reference

All API routes are prefixed with `/api`.

### Auth & Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ✗ | Register a new user |
| `POST` | `/api/auth/login` | ✗ | Login and receive auth cookie |
| `POST` | `/api/auth/logout` | ✗ | Clear session |
| `GET` | `/api/auth/profile` | ✓ | Get current user profile |
| `PATCH` | `/api/user/update-profile` | ✓ | Update profile |
| `GET` | `/api/user/:id` | ✗ | Get user by ID |
| `GET` | `/api/auth/entrepreneurs` | ✗ | List all entrepreneurs |
| `GET` | `/api/auth/investors` | ✗ | List all investors |

### Collaboration Requests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/collaboration/` | ✓ | Send a collaboration request |
| `GET` | `/api/collaboration/received` | ✓ | Get received requests |
| `GET` | `/api/collaboration/sent` | ✓ | Get sent requests |
| `PATCH` | `/api/collaboration/:id/status` | ✓ | Accept or reject a request |
| `GET` | `/api/collaboration/check/:entrepreneurId` | ✓ | Check request status |

### Meetings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/meetings/` | ✓ | Schedule a meeting |
| `GET` | `/api/meetings/` | ✓ | Get all meetings for the user |
| `PATCH` | `/api/meetings/:id/status` | ✓ | Update meeting status |

### Documents

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/documents/upload` | ✓ | Upload a document (`multipart/form-data`) |
| `GET` | `/api/documents/` | ✓ | Get documents for current user |
| `PATCH` | `/api/documents/:id/share` | ✓ | Share document with another user |
| `PATCH` | `/api/documents/:id/sign` | ✓ | Add a signature |
| `DELETE` | `/api/documents/:id` | ✓ | Delete a document |

### Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/conversations` | ✓ | Get all conversations |
| `GET` | `/api/messages/conversation/:userId` | ✓ | Get messages with a specific user |
| `POST` | `/api/messages/send` | ✓ | Send a message |

### Payments (Stripe)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/payments/subscription` | ✓ | Get current subscription info |
| `POST` | `/api/payments/create-checkout-session` | ✓ | Start a Stripe Checkout session |
| `POST` | `/api/payments/create-portal-session` | ✓ | Open Stripe Customer Portal |
| `POST` | `/api/payments/cancel-demo-subscription` | ✓ | Cancel demo subscription |
| `POST` | `/api/payments/webhook` | ✗ | Stripe webhook handler (raw body) |

---

## Subscription Plans

| Feature | Free | Pro |
|---|---|---|
| Browse profiles | ✓ | ✓ |
| Send collaboration requests | Limited | Unlimited |
| Real-time messaging | ✓ | ✓ |
| Document uploads & signing | ✓ | ✓ |
| Meeting scheduling | ✓ | ✓ |
| Priority visibility | ✗ | ✓ |

Payments are processed via [Stripe](https://stripe.com). Use the `pricing` page in the app to subscribe or manage your plan.

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow conventional commit messages and keep PRs focused.

---

## Author

**Muhammad Zakria** — [@m-zaki-237](https://github.com/m-zaki-237)
