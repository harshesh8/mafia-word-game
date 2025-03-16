"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: number
  name: string
  isMafia?: boolean
}

interface GameState {
  code: string
  host: string
  playerCount: number
  mafiaCount: number
  players: Player[]
  normalWord: string
  mafiaWord: string
  status: string
  created: string
}

export default function LobbyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const gameCode = searchParams.get("code")

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)

  useEffect(() => {
    if (!gameCode) {
      router.push("/")
      return
    }

    // Load game state
    const storedGame = localStorage.getItem(`game_${gameCode}`)
    if (!storedGame) {
      toast({
        title: "Game not found",
        description: "The game code you entered doesn't exist.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    const parsedGame = JSON.parse(storedGame) as GameState
    setGameState(parsedGame)

    // Check if player is already in the game
    const storedPlayer = localStorage.getItem("currentPlayer")
    if (storedPlayer) {
      const player = JSON.parse(storedPlayer)
      if (player.gameCode === gameCode) {
        setCurrentPlayer(player)
        setIsJoining(false)
      } else {
        setIsJoining(true)
      }
    } else {
      setIsJoining(true)
    }

    // Set up polling to check for game updates
    const interval = setInterval(() => {
      const updatedGame = localStorage.getItem(`game_${gameCode}`)
      if (updatedGame) {
        const parsed = JSON.parse(updatedGame)
        setGameState(parsed)

        // If game has started, redirect to game page
        if (parsed.status === "playing") {
          router.push(`/game?code=${gameCode}`)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameCode, router, toast])

  const handleJoinGame = () => {
    if (!gameState || !playerName.trim()) return

    // Get latest game state to avoid race conditions
    const latestGameState = localStorage.getItem(`game_${gameCode}`)
    if (!latestGameState) {
      toast({
        title: "Game not found",
        description: "The game you're trying to join no longer exists.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    const parsedGame = JSON.parse(latestGameState) as GameState
    
    // Check if game is still in lobby
    if (parsedGame.status !== "lobby") {
      toast({
        title: "Game already started",
        description: "This game has already started. You cannot join now.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    // Check if game is full
    if (parsedGame.players.length >= parsedGame.playerCount) {
      toast({
        title: "Game is full",
        description: "This game has reached its maximum number of players.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    // Check if name is already taken
    if (parsedGame.players.some(p => p.name === playerName)) {
      toast({
        title: "Name already taken",
        description: "Please choose a different name.",
        variant: "destructive",
      })
      return
    }

    // Add player to game
    const newPlayer = {
      id: parsedGame.players.length + 1,
      name: playerName,
      isMafia: false, // Will be assigned during game start
    }

    const updatedPlayers = [...parsedGame.players, newPlayer]
    const updatedGame = {
      ...parsedGame,
      players: updatedPlayers,
    }

    try {
      localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame))
      localStorage.setItem(
        "currentPlayer",
        JSON.stringify({
          id: newPlayer.id,
          name: playerName,
          gameCode,
        }),
      )

      setCurrentPlayer(newPlayer)
      setGameState(updatedGame)
      setIsJoining(false)

      toast({
        title: "Joined game",
        description: "You have successfully joined the game.",
      })
    } catch (error) {
      toast({
        title: "Error joining game",
        description: "There was an error joining the game. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStartGame = () => {
    if (!gameState) return

    // Need at least 3 players to start
    if (gameState.players.length < 3) {
      toast({
        title: "Not enough players",
        description: "You need at least 3 players to start the game.",
        variant: "destructive",
      })
      return
    }

    // Assign mafia roles randomly
    const playersCopy = [...gameState.players]

    // Reset all mafia assignments
    playersCopy.forEach((p) => (p.isMafia = false))

    // Randomly assign mafia roles
    const mafiaCount = Math.min(gameState.mafiaCount, Math.floor(playersCopy.length / 2))
    const indices = Array.from({ length: playersCopy.length }, (_, i) => i)

    for (let i = 0; i < mafiaCount; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length)
      const playerIndex = indices.splice(randomIndex, 1)[0]
      playersCopy[playerIndex].isMafia = true
    }

    const updatedGame = {
      ...gameState,
      players: playersCopy,
      status: "playing",
    }

    localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame))
    router.push(`/game?code=${gameCode}`)
  }

  const copyGameCode = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode)
      toast({
        title: "Game code copied",
        description: "Share this code with your friends to join the game.",
      })
    }
  }

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading game...</p>
      </div>
    )
  }

  const isHost = currentPlayer?.name === gameState.host

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Game Lobby
            <Button variant="outline" size="sm" onClick={copyGameCode}>
              <Copy className="mr-2 h-4 w-4" />
              {gameCode}
            </Button>
          </CardTitle>
          <CardDescription>Waiting for players to join...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isJoining ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <Button onClick={handleJoinGame} className="w-full" disabled={!playerName.trim()}>
                Join Game
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Players ({gameState.players.length}/{gameState.playerCount})
                  </h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {gameState.mafiaCount} mafias
                  </span>
                </div>
                <ul className="space-y-1">
                  {gameState.players.map((player) => (
                    <li key={player.id} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/50">
                      <span>{player.name}</span>
                      {player.name === gameState.host && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Host</span>
                      )}
                      {player.id === currentPlayer?.id && (
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">You</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {isHost && (
                <Button onClick={handleStartGame} className="w-full" disabled={gameState.players.length < 3}>
                  Start Game
                </Button>
              )}

              {!isHost && (
                <div className="text-center text-muted-foreground">Waiting for host to start the game...</div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={() => {
              localStorage.removeItem("currentPlayer")
              router.push("/")
            }}
            variant="outline"
          >
            Leave Game
          </Button>

          {isHost && !isJoining && gameState.players.length < 3 && (
            <p className="text-xs text-muted-foreground">Need at least 3 players to start</p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

