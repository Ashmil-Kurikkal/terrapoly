// Board component is now imported within GameLayout
import { useGameSocket } from "./hooks/useGameSocket"
import Lobby from "./components/Lobby/Lobby"
import { ToastContainer } from "react-toastify"
import GameLayout from "./components/GameLayout"
import Leaderboard from "./components/Leaderboard"

export default function App() {
  const { socket, gameState } = useGameSocket()

  if (!gameState || gameState.room.status === "WAITING") {
    return (
      <>
        <ToastContainer position="top-right" />
        <Lobby socket={socket} gameState={gameState} />
      </>
    )
  }

  if (gameState.room.status === "FINISHED") {
    return (
      <>
        <ToastContainer position="top-right" />
        <Leaderboard socket={socket} gameState={gameState} />
      </>
    )
  }

  return (
    <>
      <ToastContainer position="top-right" />
      <GameLayout socket={socket} gameState={gameState} />
    </>
  )
}
