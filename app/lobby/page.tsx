"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { GameState, Player } from "@/lib/supabase"

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

    // Load game state and set up real-time subscription
    const loadGame = async () => {
      try {
        // Get initial game state
        const { data: game, error } = await supabase
          .from('games')
          .select('*')
          .eq('code', gameCode)
          .single()

        if (error) throw error

        if (!game) {
          toast({
            title: "Game not found",
            description: "The game you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setGameState(game)

        // Check if player is already in the game
        const storedPlayer = localStorage.getItem("currentPlayer")
        if (storedPlayer) {
          const player = JSON.parse(storedPlayer)
          if (player.gameCode === gameCode) {
            const playerInGame = game.players.find((p: Player) => p.id === player.id)
            if (playerInGame) {
              setCurrentPlayer(playerInGame)
              setIsJoining(false)
              return
            }
          }
        }
        setIsJoining(true)
      } catch (error) {
        console.error('Error loading game:', error)
        toast({
          title: "Error loading game",
          description: "Please try again.",
          variant: "destructive",
        })
        router.push("/")
      }
    }

    loadGame()

    // Subscribe to game changes
    const subscription = supabase
      .channel(`game_${gameCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `code=eq.${gameCode}`,
        },
        (payload) => {
          const updatedGame = payload.new as GameState
          setGameState(updatedGame)

          // If game has started, redirect to game page
          if (updatedGame.status === "playing") {
            router.push(`/game?code=${gameCode}`)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [gameCode, router, toast])

  const handleJoinGame = async () => {
    if (!gameState || !playerName.trim() || isJoining) return

    try {
      // Get latest game state to avoid race conditions
      const { data: latestGame, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('code', gameCode)
        .single()

      if (fetchError) throw fetchError

      // Check if game is still in lobby
      if (latestGame.status !== "lobby") {
        toast({
          title: "Game already started",
          description: "This game has already started. You cannot join now.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      // Check if game is full
      if (latestGame.players.length >= latestGame.playerCount) {
        toast({
          title: "Game is full",
          description: "This game has reached its maximum number of players.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      // Check if name is already taken
      if (latestGame.players.some(p => p.name === playerName)) {
        toast({
          title: "Name already taken",
          description: "Please choose a different name.",
          variant: "destructive",
        })
        return
      }

      // Add player to game
      const newPlayer = {
        id: latestGame.players.length + 1,
        name: playerName,
        isMafia: false, // Will be assigned during game start
      }

      const updatedPlayers = [...latestGame.players, newPlayer]
      
      // Update game in Supabase
      const { error: updateError } = await supabase
        .from('games')
        .update({ players: updatedPlayers })
        .eq('code', gameCode)

      if (updateError) throw updateError

      // Store current player info
      localStorage.setItem(
        "currentPlayer",
        JSON.stringify({
          id: newPlayer.id,
          name: playerName,
          gameCode,
        })
      )

      setCurrentPlayer(newPlayer)
      setIsJoining(false)

      toast({
        title: "Joined game",
        description: "You have successfully joined the game.",
      })
    } catch (error) {
      console.error('Error joining game:', error)
      toast({
        title: "Error joining game",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStartGame = async () => {
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

    try {
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

      // Update game state in Supabase
      const { error } = await supabase
        .from('games')
        .update({
          players: playersCopy,
          status: "playing",
        })
        .eq('code', gameCode)

      if (error) throw error

      router.push(`/game?code=${gameCode}`)
    } catch (error) {
      console.error('Error starting game:', error)
      toast({
        title: "Error starting game",
        description: "Please try again.",
        variant: "destructive",
      })
    }
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
                      <div className="flex items-center space-x-1">
                        {player.name === gameState.host && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Host</span>
                        )}
                        {player.id === currentPlayer?.id && (
                          <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
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

