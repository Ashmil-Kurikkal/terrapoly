# Terrapoly 2030 (Terrapoly)

![Terrapoly 2030 Banner](https://github.com/Ashmil-Kurikkal/terrapoly/blob/main/logo.png)

**Terrapoly 2030** is a multiplayer, web-based board game that intertwines classic property-trading mechanics with the urgency of the UN's Sustainable Development Goals (SDGs). Players navigate a virtual board, investing their "Impact Points" into global initiatives rather than real estate. The goal is to survive 15 rounds without letting any global SDG category collapse, while competing to be the most impactful investor.


https://github.com/user-attachments/assets/d36aac94-7acd-44e9-af63-d636002d7746




## 🌟 Core Features

- **Multiplayer Lobby System:** Create private rooms, share a 6-character room code, and play with friends in real-time.
- **Dynamic AI Bots:** Play solo or fill empty slots with bots that have distinct personalities (`Greedy`, `Eco-Warrior`, `Balanced`). Bots vote, invest, and react to board states autonomously.
- **SDG Mechanics:** Every property belongs to a category (Climate, Education, Health, Energy, Justice). Players must balance personal wealth with the global health of these categories.
  - **Invest:** Spend Impact Points to seed a property.
  - **Donation:** Pay out Impact Points to an owned property, which boosts the global SDG score.
  - **Apathy Tax:** Neglecting to invest in an open property degrades the global SDG score and costs personal points.
- **Crises & Events:** Strategic milestones at Rounds 5, 10, and 15 trigger global crises that heavily penalize players who ignore underfunded SDGs.
- **3D Interactive Dice:** Smooth, real-time board navigation and 3D dice rolls powered by React Three Fiber.
- **Rich User Interface:** A meticulously crafted HUD featuring player stats, a central event feed, modal popups, and animated token movements.

## 🏗 Tech Stack

### Frontend (`/terrapoly-frontend`)
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4, Framer Motion (for UI animations)
- **3D Rendering:** Three.js, React Three Fiber, React Three Cannon (physics)
- **Networking:** Socket.io-client

### Backend (`/terrapoly-backend`)
- **Server:** Node.js, Express
- **Real-Time Communication:** Socket.io
- **Database:** PostgreSQL (running locally via Docker)
- **ORM:** Prisma

## 🚀 Getting Started
Follow these steps to run the Terra 2030 game locally:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/) (Required for spinning up the local PostgreSQL database)
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/terrapoly.git
cd terrapoly
```

### 3. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd terrapoly-backend
   ```
2. Start the PostgreSQL Docker database container:
   ```bash
   docker compose up -d
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Push the Prisma schema to the database to create the necessary tables:
   ```bash
   npm run db:push
   ```
5. Start the backend development server (defaults to port 3000):
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Open a new terminal instance and navigate to the frontend directory:
   ```bash
   cd terrapoly-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

## 📁 Repository Structure

```text
/
├── terrapoly-frontend/     # React client app
│   ├── src/
│   │   ├── components/     # UI Components (HUD, PropertyCards, Modals)
│   │   ├── game/           # Core game logic & 3D board rendering
│   │   └── utils/          # Helpers and shared types
│   └── package.json
└── terrapoly-backend/      # Node.js/Express/Socket.io server
    ├── prisma/             # Database schema and migrations
    ├── server.ts           # Express and Socket.io initialization
    ├── gameHandler.ts      # Core authoritative game logic
    └── package.json
```

## 📖 API Documentation
For detailed insights into the WebSocket events and game state payloads, please reference the [API Docs](terrapoly-backend/API_DOCS.md).

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/terrapoly/issues).

## 📝 License
This project is licensed under the ISC License.
