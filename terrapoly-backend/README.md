# Terra 2030 Backend Server

This is the Node.js/Express/Socket.io backend for the **Terra 2030** board game.

## Prerequisites
- **Node.js**: v18 or higher recommended.
- **Docker**: Used to run the local PostgreSQL database.

## Running the Server Locally

### 1. Start the Database
The backend relies on PostgreSQL. We have provided a Docker configuration to instantly spin up a local database on port 5434.
Open your terminal and run:
```bash
docker compose up -d
```
*(To stop the database later, you can run `docker compose down`)*

### 2. Install Dependencies
```bash
npm install
```

### 3. Sync the Database Schema
Before running the code, force Prisma to create the necessary SQL tables in your Docker database:
```bash
npm run db:push
```

### 4. Start the Application
You have two options to run the server depending on what you are doing:

**Option A: Development Mode (Hot Reloading)**
If you are actively making changes to `gameHandler.ts` or `server.ts` and want the server to restart automatically when you hit save:
```bash
npm run dev
```

**Option B: Production Mode (Compiled)**
If you just want to run the server robustly for testing the frontend:
```bash
npm run build
npm start
```

## Stopping the Server
To stop the Node.js server, simply press `Ctrl + C` in the terminal where the server is running.
To shut down the database container, run `docker compose down` in the project root.
