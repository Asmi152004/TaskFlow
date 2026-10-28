# How TaskFlow works

Read this before an interview. For each topic it points to the file where the code lives, so you can open it and trace the logic yourself. The best preparation is to run the app, then change something small (add a field to tasks, add a new filter, change a permission rule) and see what breaks.

## 1. Big picture

```
React app (Vercel)  --HTTPS + JWT-->  Express API (Render)  --Mongoose-->  MongoDB Atlas
```

- The frontend never talks to the database. It calls the REST API through one Axios instance (`frontend/src/api.js`).
- The API validates the request, checks who the user is and what they may do, then reads or writes MongoDB.
- Every API response has the shape `{ success: true, ... }` or `{ success: false, message }`.

## 2. Data model (`backend/models`)

- **User:** name, email (unique), password hash. The hash has `select: false`, so queries never return it unless asked.
- **Project:** name, description, `owner` (a User), `members` (array of Users). The owner is also stored in `members` so "is this user in the project?" is one check.
- **Task:** belongs to a project; has title, description, status (`todo`, `in_progress`, `done`), priority, due date, `assignee`, `createdBy` and an embedded array of **comments**.

Why comments are embedded in the task: they are always read together with the task and are small, so one query returns everything. If comments grew very large you would move them to their own collection.

Indexes: `{ project, status }` on tasks speeds up the board query; `{ members }` on projects speeds up "my projects".

## 3. Authentication (JWT)

1. **Register** (`authController.register`): validate input, hash the password with bcrypt (10 salt rounds), save the user, return a signed token.
2. **Login** (`authController.login`): find the user, compare the password with `bcrypt.compare`, return a token. The error message is the same for "unknown email" and "wrong password" so attackers cannot discover which emails exist.
3. The token contains only the user id and expires after 7 days. It is signed with `JWT_SECRET`, so it cannot be forged or edited.
4. The frontend stores the token in `localStorage` and the Axios interceptor adds `Authorization: Bearer <token>` to every request.
5. **`middleware/auth.js` (`protect`)** verifies the token, loads the user and puts it on `req.user`. Invalid or expired tokens get a 401, and the frontend interceptor logs the user out.

Trade-off to mention: `localStorage` is simple but readable by JavaScript, so an XSS bug could steal the token. HttpOnly cookies are safer but need extra CSRF and CORS setup.

## 3b. Authorization (role-based access control)

Authentication answers "who are you?"; authorization answers "what may you do?".

- `middleware/projectAccess.js` runs `loadProject` (is the user a member of this project? otherwise 403) and `requireOwner` (owner-only routes such as deleting a project or adding members).
- Task-level rules live in `taskController.loadTaskWithAccess`: owners can edit and delete any task, creators can edit and delete their own, assignees can edit the task assigned to them, other members can only view and comment.
- The frontend hides buttons the user cannot use (`canEdit` in `ProjectBoard.jsx`), but **the API is what enforces the rules**. Hiding a button is only convenience; never rely on it for security.

## 4. Request flow example: moving a task

1. The user drags a card to another column (`ProjectBoard.jsx`, `handleDrop` then `moveTask`).
2. The board updates immediately (optimistic update) and sends `PUT /api/tasks/:id` with the new status.
3. The API runs `protect`, then `loadTaskWithAccess` (member? allowed to edit?), validates the status value through the Mongoose enum, saves, and returns the updated task.
4. If the API returns an error, the frontend restores the previous state and shows a toast.

Drag and drop uses the browser's native HTML5 drag events (`draggable`, `onDragStart`, `onDragOver`, `onDrop`), so no extra library is needed.

## 5. Dashboard and aggregation

`dashboardController.getDashboard` finds the user's projects, then runs several queries in parallel with `Promise.all`. The status and priority counts use MongoDB's aggregation pipeline (`$match` then `$group`), which counts inside the database instead of loading every task into Node. Overdue means `dueDate < now` and `status != done`.

## 6. Error handling and validation

- Route handlers are wrapped in `asyncHandler`, so any thrown error reaches `middleware/error.js`.
- `ApiError(statusCode, message)` is used for expected problems (400, 401, 403, 404, 409).
- The error middleware also translates Mongoose validation errors, bad ObjectIds (`CastError`) and duplicate emails (code 11000) into clean 4xx responses, and hides internal details for real 500 errors.
- Inputs are validated in the controllers and again by the Mongoose schemas.

## 7. Deployment notes

- CORS only allows the origins listed in `CLIENT_URL`.
- Secrets live in environment variables, never in Git (`.env` is in `.gitignore`).
- The database connection failing does not crash the server; it logs the reason, and `/api/health` reports the state.
- `vercel.json` rewrites every path to `index.html` so React Router works when a deployed page is refreshed.

## 8. Likely interview questions

**Walk me through what happens when a user logs in.**
The form posts email and password to `/api/auth/login`. The server finds the user, compares the password with bcrypt, and returns a JWT plus the user's public details. The frontend saves the token and sends it on every later request.

**Why hash passwords? Why bcrypt?**
So a database leak does not expose real passwords. bcrypt is deliberately slow and adds a random salt, which makes brute-force attacks expensive.

**What is a JWT and what is inside yours?**
A signed token with three parts (header, payload, signature). Mine holds the user id and expiry. The server verifies the signature, so it needs no session storage.

**How do you stop a member from deleting someone else's task?**
In `taskController.loadTaskWithAccess` the API loads the task and its project, checks membership, and only allows deletion for the project owner or the task creator. Otherwise it returns 403.

**Why check permissions in the backend if the frontend already hides the buttons?**
Anyone can call the API directly with Postman or curl. Only server-side checks are real security.

**What is an optimistic update?**
Updating the UI before the server confirms, then rolling back on failure. It makes the board feel instant.

**How would you add real-time updates?**
Add WebSockets (for example Socket.IO): when a task changes, the server emits an event to everyone in that project's room, and clients update their state.

**How does pagination work in the tasks API?**
`page` and `limit` become `skip` and `limit` in the query, and the response includes `total` and `pages`. Limit is capped at 200.

**What is a MongoDB aggregation pipeline?**
A series of stages (`$match`, `$group`, ...) that processes documents inside the database. I use it to count tasks per status without loading them all.

**What would you improve?**
Real-time sync, automated tests, email invitations, refresh tokens or HttpOnly cookies, and rate limiting on the login route.

**Why did you embed comments inside tasks?**
They are always loaded with the task and are small, so one query is enough. A separate collection would be better if they grew large or needed their own queries.

**How do you handle the free-tier cold start?**
The Axios timeout is 60 seconds, errors show a friendly message, and a free uptime monitor can ping `/api/health` to keep the server awake.
