# TaskFlow

A full-stack team project and task manager. Create projects, invite teammates, and move tasks across a Kanban board with drag and drop. Access is role-based: project owners manage the team and every task, while members work on their own tasks and collaborate through comments.

**Live demo:** _add your Vercel link here_ &nbsp;|&nbsp; **API:** _add your Render link here_

**Demo login:** `demo@taskflow.com` / `Demo@1234` (after running `npm run seed`, see below)

## Screenshots

<!-- Add 3 screenshots to docs/screenshots and uncomment:
![Dashboard](docs/screenshots/dashboard.png)
![Kanban board](docs/screenshots/board.png)
![Task details](docs/screenshots/task.png)
-->

## Features

- **Authentication** with JWT and bcrypt-hashed passwords; protected routes on both the API and the frontend
- **Role-based access control** per project (see the table below)
- **Projects and teams:** create projects, add registered users by email, remove members
- **Kanban board** (To Do, In Progress, Done) with drag and drop, plus a dropdown fallback for phones
- **Tasks** with title, description, priority, due date, assignee and status
- **Comments** on every task
- **Search and filters** by text, priority and assignee
- **Dashboard** with progress overview, overdue count, priority breakdown and "my open tasks", built with MongoDB aggregation
- **Optimistic UI:** the board updates instantly and rolls back if the server rejects a change
- Central error handling, input validation, pagination and filtering on the tasks API, and a `/api/health` endpoint

### Who can do what

| Action | Owner | Member |
| --- | :---: | :---: |
| View project, tasks and comments | Yes | Yes |
| Create tasks and post comments | Yes | Yes |
| Edit a task | Any task | Own or assigned tasks |
| Delete a task | Any task | Own tasks |
| Add or remove members | Yes | No |
| Rename or delete the project | Yes | No |

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, React Router, Tailwind CSS, Axios, React Toastify, Vite |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Hosting | Vercel (frontend), Render (API), MongoDB Atlas (database) |

## Project structure

```
taskflow/
├── backend/
│   ├── config/          database connection
│   ├── controllers/     auth, projects, tasks, dashboard
│   ├── middleware/      JWT auth, project access (RBAC), error handling
│   ├── models/          User, Project, Task
│   ├── routes/          route definitions
│   ├── utils/           ApiError, asyncHandler
│   ├── seed.js          demo data
│   └── server.js        app entry point
├── frontend/
│   └── src/
│       ├── components/  Navbar, TaskCard, TaskModal, Modal, ...
│       ├── context/     AuthContext
│       ├── pages/       Login, Register, Dashboard, Projects, ProjectBoard
│       ├── utils/       helpers
│       └── api.js       configured Axios instance
├── docs/HOW_IT_WORKS.md architecture notes and interview preparation
└── render.yaml          optional Render blueprint
```

## Getting started (local)

You need [Node.js](https://nodejs.org) 18 or newer and a MongoDB database (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works well).

```bash
# 1. Get the code
git clone https://github.com/Asmi152004/TaskFlow.git
cd TaskFlow

# 2. Backend
cd backend
npm install
cp .env.example .env        # then open .env and fill in MONGODB_URI and JWT_SECRET
npm run seed                # optional: creates demo users, projects and tasks
npm run dev                 # API on http://localhost:5000

# 3. Frontend (open a second terminal)
cd frontend
npm install
cp .env.example .env        # points to http://localhost:5000 by default
npm run dev                 # app on http://localhost:5173
```

On Windows, if `cp` does not work, copy the `.env.example` file manually and rename the copy to `.env`.

## Environment variables

**Backend** (`backend/.env`)

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DB_NAME` | Database name (default `taskflow`) |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_URL` | Frontend URL allowed by CORS, no trailing slash |
| `PORT` | Server port (default `5000`; set automatically on Render) |

**Frontend** (`frontend/.env`)

| Variable | Description |
| --- | --- |
| `VITE_BACKEND_URL` | Base URL of the API, no trailing slash |

## API reference

All routes except register and login require the header `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and receive a token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | Projects the user belongs to, with task counts |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:projectId` | Project details and members |
| PUT | `/api/projects/:projectId` | Update a project (owner) |
| DELETE | `/api/projects/:projectId` | Delete a project and its tasks (owner) |
| POST | `/api/projects/:projectId/members` | Add a member by email (owner) |
| DELETE | `/api/projects/:projectId/members/:userId` | Remove a member (owner) |
| GET | `/api/projects/:projectId/tasks` | List tasks. Query: `status`, `priority`, `assignee`, `search`, `page`, `limit`, `sort` |
| POST | `/api/projects/:projectId/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/tasks/:id/comments` | Add a comment |
| GET | `/api/dashboard` | Summary statistics |
| GET | `/api/health` | Server and database status |

## Deployment

The app runs on three free services. Deploy in this order: database, API, frontend.

### 1. MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access:** add a user with a simple password (letters and numbers, no `@`).
3. **Network Access:** add `0.0.0.0/0` (allow access from anywhere) so Render can connect.
4. **Connect, Drivers:** copy the connection string and replace `<password>` with your password.

### 2. Backend on Render

1. On [render.com](https://render.com), choose **New, Web Service** and connect this GitHub repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. Under **Environment**, add:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = a long random string
   - `CLIENT_URL` = your Vercel URL (you can add this after step 3)
   - `NODE_VERSION` = `20`
4. Deploy, then open `https://<your-service>.onrender.com/api/health`. You should see `{"server":"ok","database":"connected"}`.

(A `render.yaml` blueprint is included if you prefer **New, Blueprint**.)

### 3. Frontend on Vercel

1. On [vercel.com](https://vercel.com), choose **Add New, Project** and import this repository.
2. Set **Root Directory** to `frontend`. The Vite settings are detected automatically.
3. Add the environment variable `VITE_BACKEND_URL` = your Render URL (no trailing slash).
4. Deploy.
5. Go back to Render, set `CLIENT_URL` to your Vercel URL, and let it redeploy.

### 4. Add demo data (optional but recommended)

From your computer, with `backend/.env` pointing to the Atlas database:

```bash
cd backend
npm run seed
```

This creates the demo accounts so visitors can explore a populated app.

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| First request is slow or the board shows an error | Render's free tier sleeps after 15 minutes of inactivity and takes up to a minute to wake. Wait and retry. A free uptime monitor (for example UptimeRobot) pinging `/api/health` every 5 minutes keeps it awake. |
| Browser console shows a CORS error | `CLIENT_URL` on Render does not match your Vercel URL exactly (check for a trailing slash or `http` vs `https`). |
| `/api/health` shows `"database":"disconnected"` | Atlas cluster is paused, `0.0.0.0/0` is missing from Network Access, or the password in `MONGODB_URI` is wrong. Check the Render logs. |
| Login works locally but not when deployed | `VITE_BACKEND_URL` is missing or wrong on Vercel. Environment variable changes need a redeploy. |
| Page not found when refreshing a deployed page | `frontend/vercel.json` must be present; it routes every path to the app. |

## Ideas for future improvements

- Real-time board updates for all team members (WebSockets)
- Email invitations and notifications
- File attachments on tasks
- Automated tests and a CI pipeline

## Author

Built by [Asmi Walia](https://github.com/Asmi152004).
