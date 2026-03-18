# Terra 2030 Backend API Documentation

The Terra 2030 backend operates primarily over WebSockets using **Socket.io**. There is only one HTTP endpoint for basic health checks. All gameplay mechanics, state synchronization, and client actions are handled asynchronously via standard WebSocket `emit` and `on` events.

---

## 1. HTTP Endpoints

### `GET /health`
Returns the status of the Express server to confirm it is live.
- **URL params:** None
- **Body:** None
- **Response:**
  ```json
  {
    "status": "OK",
    "version": "1.0"
  }
  ```

---

## 2. Server -> Client Events (Listeners)
Your frontend must listen (`socket.on`) to these events to update the UI and game state.

### `state_update`
Fired every single time the game state changes (a player moves, buys property, a round ends, etc.). Overwrites the frontend's local state.
- **Payload:**
  ```typescript
  {
    room: {
      id: string,
      roomCode: string,
      status: "WAITING" | "ACTIVE" | "FINISHED",
      currentRound: number, // 1 through 15
      currentTurnIdx: number, // Index of the player whose turn it is
      sdgClimate: number,
      sdgEducation: number,
      sdgHealth: number,
      sdgEnergy: number,
      sdgJustice: number
    },
    players: [
      {
         id: string,
         roomId: string,
         socketId: string | null,
         name: string,
         impactPoints: number, // Player's money/balance
         position: number, // 0 to 39
         isActive: boolean,
         isBot: boolean,
         botPersonality: string | null
      }
    ],
    properties: [
      {
         id: string,
         roomId: string,
         squareIndex: number,
         ownerId: string,
         investmentLevel: string, // "SEED"
         bonusReturns: number
      }
    ]
  }
  ```

### `game_started`
Fired when the host starts the game to trigger a UI transition.
- **Payload:** None (empty).

### `player_moved`
Fired instantly when a dice roll concludes. Use this to trigger pawn movement animations.
- **Payload:**
  ```typescript
  {
    playerId: string,
    position: number, // New position (0-39)
    roll: number      // The dice roll result (2-12)
  }
  ```

### `crisis_triggered`
Fired on Rounds 5, 10, and 15 if the game continues. Triggers an alert or popup.
- **Payload:**
  ```typescript
  {
    category: "Climate" | "Education" | "Health" | "Energy" | "Justice", // The lowest SDG
    bystanderId: string | null // The player with fewest properties in this category who just lost 40 points
  }
  ```

### `game_over`
Fired when round 15 completes, or if any global SDG drops to 0. 
- **Payload:**
  ```typescript
  {
    reason: "collapse" | "victory", // "collapse" = SDGs hit 0. "victory" = Survived 15 rounds
    winnerId?: string // Only present if reason === "victory". The ID of the winner.
  }
  ```

---

## 3. Client -> Server Events (Emitters)
Your frontend calls `socket.emit('event_name', payload)` to trigger an action. The backend calculates the logic and immediately replies with a new `state_update`.

### `create_room`
Generates a new, randomized 6-character room code and creates the lobby. Requires an acknowledgment callback function to receive the response.
- **Payload (No Args):** `none`
- **Callback Response:**
  ```typescript
  {
    roomCode?: string, // The generated 6-character code
    error?: string     // If something went wrong
  }
  ```

### `join_room`
Connect a player to a lobby. If the `playerId` exists in memory, they immediately reconnect without state loss. If the room does not exist, an `error` event is emitted.
- **Payload:**
  ```typescript
  {
    roomCode: string,
    playerName: string,
    playerId: string // Use a saved UUID from localStorage
  }
  ```

### `add_bot`
Spawns an AI bot into the waiting room.
- **Payload:**
  ```typescript
  {
    roomCode: string,
    botPersonality: "Greedy" | "Eco-Warrior" | "Balanced"
  }
  ```

### `start_game`
Moves the room status from `WAITING` to `ACTIVE`.
- **Payload:**
  ```typescript
  {
    roomCode: string
  }
  ```

### `roll_dice`
Rolls two 6-sided dice and advances the player.
- **Payload:**
  ```typescript
  {
    roomCode: string,
    playerId: string
  }
  ```

### `invest`
Purchases a seeded property at exactly 50 impact points. Only allowed on unowned SDG squares.
- **Payload:**
  ```typescript
  {
    roomCode: string,
    playerId: string,
    squareIndex: number
  }
  ```

### `pay_donation`
Pays 15 impact points to the owner of the square. Boosts that square's category SDG score globally.
- **Payload:**
  ```typescript
  {
    roomCode: string,
    playerId: string, // The person who landed on the square
    squareIndex: number
  }
  ```

### `pass_action`
Chosen when a player lands on a property but refuses to buy. Triggers an Apathy Tax (costs player 15 pts, category SDG degrades by 5).
- **Payload:**
  ```typescript
  {
    roomCode: string,
    playerId: string,
    squareIndex: number
  }
  ```

### `end_turn`
Concludes the active player's sequence. Advances `currentTurnIdx`. Triggers end-of-round SDG decay and bonus distributions if it wraps back to 0.
- **Payload:**
  ```typescript
  {
    roomCode: string
  }
  ```
