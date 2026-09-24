# NirmanXpert Backend Assessment & Real-Time Chat

A full-stack implementation demonstrating robust RESTful APIs, secure WebSocket communication, Role-Based Access Control (RBAC), and enterprise-grade frontend architecture.

## Tech Stack

**Backend**
- Node.js & Express
- TypeScript
- Prisma ORM & MongoDB Atlas
- Socket.io (Real-time events)
- Redis (In-memory Rate Limiting)
- JWT (Access & Refresh Tokens)

**Frontend**
- React & Vite (TypeScript)
- Tailwind CSS (Custom UI & Layouts)
- Axios Interceptors
- Feature-Based 4-Layer Architecture (UI -> Hooks -> API -> Context)

## Core Features

1. **Authentication & Security**
   - Secure login and registration with BCrypt hashing.
   - Dual-token system (15m Access Token, 7d Refresh Token) stored via HTTP-only cookies.
   - Silent, automatic token refreshing via Axios Interceptors.
   - Helmet middleware for HTTP header protection.

2. **Role-Based Access Control (RBAC)**
   - Roles: `ADMIN`, `MODERATOR`, `MEMBER`.
   - Admins can manage users, rename/delete channels, and moderate all content.
   - Moderators can delete messages and mute users globally.
   - Members can only participate in assigned channels.

3. **Real-Time WebSockets**
   - Room-based channel architecture via Socket.io.
   - Handshake authentication securely passes JWT via cookies.
   - Live message broadcasting, editing, and synchronization.
   - Cross-client real-time deletion (`message_deleted` event).
   - Typing indicators (`user_typing`).

4. **Rate Limiting & Moderation**
   - Redis-backed sliding window rate limiter on the Socket connection.
   - Prevents chat spam (Max 5 messages per 3 seconds per user).

## Architecture

### Database Schema
The MongoDB Replica Set stores:
- **User**: Email, Password, Role.
- **Channel**: Name, isPublic.
- **ChannelMember**: Tracks which users are in which channels, including mute status.
- **Message**: Content, Sender (Relation), Channel (Relation), `isDeleted` and `isEdited` flags.

### Frontend 4-Layer Architecture
The React frontend strictly adheres to a scalable 4-layer structure inside `src/features/`:
1. **Layer 1 (API)**: Axios instances and REST calls.
2. **Layer 2 (Hooks)**: Custom hooks (`useChat`, `useAuth`) managing complex business logic and socket listeners.
3. **Layer 3 (State/Context)**: React Context providers containing globally shared session state.
4. **Layer 4 (UI)**: Pure presentational components receiving strictly props and handlers from hooks.

### Architectural Limitations
**Presence Tracking**: Presence tracking currently uses an in-memory connection counter and is intended for a single backend instance. A shared Redis-based presence mechanism would be required for horizontally scaled deployments to ensure accurate presence across multiple pods.

---

## AI Collaboration

This project leveraged AI assistance for several aspects of development:
- **UI/UX Recommendations**: AI was used to generate modern design patterns, select cohesive icon sets (Lucide), and build out the responsive chat layouts and modals.
- **Code Generation & Refactoring**: AI assisted in refactoring the application to use highly secure HTTP-only cookies and in structuring the scalable 4-layer frontend architecture.
- **Troubleshooting**: AI was utilized to debug complex race conditions, resolve socket event syncing issues, and fix strict TypeScript linting errors.

---

## Setup Instructions

### 1. Prerequisites
Ensure you have Node.js and a Redis instance running locally (port 6379).

### 2. Environment Setup
Create a `.env` file in the `/backend` folder:
```env
PORT=5000
FRONTEND_URL="http://localhost:5173"
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/nirmanxpert?retryWrites=true&w=majority"
JWT_ACCESS_SECRET="your-super-secret-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"
```

Create a `.env` file in the `/frontend` folder:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_BACKEND_URL="http://localhost:5000"
```

### 3. Installation & Seeding
In the `/backend` directory:
```bash
npm install
npx prisma generate
npx prisma db push
npm run seed
```
*(Seeding creates default Demo accounts for Admin, Moderator, and Member, as well as a default "General" channel).*

In the `/frontend` directory:
```bash
npm install
```

### 4. Running the Application
Start both servers simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Evaluation Guide (Dual-Window Demo)

To evaluate the real-time syncing and RBAC moderation, follow these steps:

1. Open `http://localhost:5173` in a standard browser window and click **Login as Admin**.
2. Open `http://localhost:5173` in an **Incognito** window and click **Login as Member**.
3. Type messages in the Member window—watch them instantly appear in the Admin window.
4. In the Admin window, open the channel settings to rename the channel, or hover over the Member's message to delete it.
5. Watch the changes dynamically update in both windows in real-time.
6. Spam the Enter key in the Member window to trigger the Socket.io Redis Rate Limiter notification!
