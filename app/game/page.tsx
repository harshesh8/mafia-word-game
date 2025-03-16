"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Users } from "lucide-react"

interface Player {
  id: number
  name: string
  isMafia?: boolean
  vote?: number
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
  votes?: Record<number, number>
  votingComplete?: boolean
  mafiaRevealed?: boolean
}

export default function GamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const gameCode = searchParams.get("code")

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [showWord, setShowWord] = useState(false)
  const [votingOpen, setVotingOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)

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
        description: "The game you're looking for doesn't exist.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    const parsedGame = JSON.parse(storedGame) as GameState
    setGameState(parsedGame)

    // Check if player is in the game
    const storedPlayer = localStorage.getItem("currentPlayer")
    if (!storedPlayer) {
      toast({
        title: "Not in game",
        description: "You're not part of this game.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    const player = JSON.parse(storedPlayer)
    if (player.gameCode !== gameCode) {
      toast({
        title: "Wrong game",
        description: "You're not part of this game.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    // Find player in game state
    const playerInGame = parsedGame.players.find((p) => p.id === player.id)
    if (!playerInGame) {
      toast({
        title: "Player not found",
        description: "You're not part of this game.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    setCurrentPlayer(playerInGame)

    // Set up polling to check for game updates
    const interval = setInterval(() => {
      const updatedGame = localStorage.getItem(`game_${gameCode}`)
      if (updatedGame) {
        const parsed = JSON.parse(updatedGame)
        setGameState(parsed)

        // Update current player info
        const updatedPlayer = parsed.players.find((p) => p.id === player.id)
        if (updatedPlayer) {
          setCurrentPlayer(updatedPlayer)
        }

        // Check if voting is complete
        if (parsed.votingComplete && !resultsOpen) {
          setResultsOpen(true)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameCode, router, toast])

  const handleStartVoting = () => {
    if (!gameState) return

    const updatedGame = {
      ...gameState,
      votes: {},
      votingComplete: false,
      mafiaRevealed: false,
    }

    localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame))
    setGameState(updatedGame)
    setVotingOpen(true)
  }

  const handleVote = () => {
    if (!gameState || !currentPlayer || selectedPlayer === null) return

    // Record vote
    const updatedVotes = { ...(gameState.votes || {}) }
    updatedVotes[currentPlayer.id] = selectedPlayer

    const updatedGame = {
      ...gameState,
      votes: updatedVotes,
    }

    // Check if all players have voted
    const voteCount = Object.keys(updatedVotes).length
    if (voteCount === gameState.players.length) {
      updatedGame.votingComplete = true
    }

    localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame))
    setGameState(updatedGame)
    setVotingOpen(false)

    toast({
      title: "Vote recorded",
      description: "Your vote has been recorded.",
    })
  }

  const handleRevealMafias = () => {
    if (!gameState) return

    const updatedGame = {
      ...gameState,
      mafiaRevealed: true,
    }

    localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame))
    setGameState(updatedGame)
  }

  const handlePlayAgain = () => {
    if (!gameState || !gameCode) return

    // Reset game state to lobby
    const updatedGame = {
      ...gameState,
      status: "lobby",
      votes: {},
      votingComplete: false,
      mafiaRevealed: false,
    }

    localStorage.setItem(`game_${gameCode}`, JSON.stringify(updatedGame))
    router.push(`/lobby?code=${gameCode}`)
  }

  const getVoteCounts = () => {
    if (!gameState || !gameState.votes) return {}

    const voteCounts: Record<number, number> = {}

    Object.values(gameState.votes).forEach((votedId) => {
      voteCounts[votedId] = (voteCounts[votedId] || 0) + 1
    })

    return voteCounts
  }

  const getMostVotedPlayers = () => {
    const voteCounts = getVoteCounts()
    if (Object.keys(voteCounts).length === 0) return []

    const maxVotes = Math.max(...Object.values(voteCounts))
    const mostVotedIds = Object.entries(voteCounts)
      .filter(([_, count]) => count === maxVotes)
      .map(([id]) => Number.parseInt(id))

    return gameState?.players.filter((p) => mostVotedIds.includes(p.id)) || []
  }

  if (!gameState || !currentPlayer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading game...</p>
      </div>
    )
  }

  const playerWord = currentPlayer.isMafia ? gameState.mafiaWord : gameState.normalWord
  const isHost = currentPlayer.name === gameState.host
  const hasVoted = gameState.votes && currentPlayer.id in gameState.votes
  const allPlayersVoted = gameState.votes && Object.keys(gameState.votes).length === gameState.players.length
  const mostVotedPlayers = getMostVotedPlayers()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Word Mafia</CardTitle>
          <CardDescription>Game Code: {gameCode}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Word</h3>
            <div className="relative">
              <div className={`text-2xl font-bold p-4 rounded-md bg-muted/50 ${showWord ? "" : "blur-md"}`}>
                {playerWord}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                onClick={() => setShowWord(!showWord)}
              >
                {showWord ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showWord ? "Hide Word" : "Show Word"}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {currentPlayer.isMafia
                ? "You are a MAFIA! Try to blend in with the others."
                : "You are a CIVILIAN. Try to identify the mafias."}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Players ({gameState.players.length})
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
                    {player.id === currentPlayer.id && (
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">You</span>
                    )}
                    {gameState.mafiaRevealed && player.isMafia && (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Mafia</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Discuss with other players to figure out who has a different word!
            </p>

            {isHost && !gameState.votingComplete && (
              <Button onClick={handleStartVoting} className="w-full">
                Start Voting
              </Button>
            )}

            {!isHost && !gameState.votingComplete && !hasVoted && (
              <p className="text-center text-sm text-muted-foreground">Waiting for host to start voting...</p>
            )}

            {hasVoted && !gameState.votingComplete && (
              <p className="text-center text-sm text-primary">Your vote has been recorded. Waiting for others...</p>
            )}
          </div>
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
        </CardFooter>
      </Card>

      {/* Voting Dialog */}
      <Dialog open={votingOpen} onOpenChange={setVotingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote for the Mafia</DialogTitle>
            <DialogDescription>Who do you think has a different word?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {gameState.players
              .filter((p) => p.id !== currentPlayer?.id)
              .map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                    selectedPlayer === player.id ? "bg-primary/20" : "bg-muted/50 hover:bg-muted"
                  }`}
                  onClick={() => setSelectedPlayer(player.id)}
                >
                  <span>{player.name}</span>
                  {selectedPlayer === player.id && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Selected</span>
                  )}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVotingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVote} disabled={selectedPlayer === null}>
              Submit Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voting Results</DialogTitle>
            <DialogDescription>Here's who everyone voted for</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Most Voted Players:</h3>
              <div className="space-y-1">
                {mostVotedPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span>{player.name}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {getVoteCounts()[player.id] || 0} votes
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {isHost && !gameState.mafiaRevealed && (
              <Button onClick={handleRevealMafias} className="w-full">
                Reveal Mafias
              </Button>
            )}

            {gameState.mafiaRevealed && (
              <div className="space-y-2">
                <h3 className="font-medium">The Mafias were:</h3>
                <div className="space-y-1">
                  {gameState.players
                    .filter((p) => p.isMafia)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-md bg-destructive/10"
                      >
                        <span>{player.name}</span>
                        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                          Mafia
                        </span>
                      </div>
                    ))}
                </div>
                <div className="mt-4 p-3 rounded-md bg-muted/50">
                  <p className="text-sm font-medium">The words were:</p>
                  <div className="flex justify-between mt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Civilians:</span>
                      <p className="font-medium">{gameState.normalWord}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Mafias:</span>
                      <p className="font-medium">{gameState.mafiaWord}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isHost && gameState.mafiaRevealed && (
              <Button onClick={handlePlayAgain} className="w-full">
                Play Again
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

