"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateGameCode, generateWordPair } from "@/lib/game-utils"

export default function CreateGamePage() {
  const router = useRouter()
  const [playerCount, setPlayerCount] = useState(5)
  const [mafiaCount, setMafiaCount] = useState(2)
  const [playerName, setPlayerName] = useState("")

  const handleCreateGame = () => {
    if (!playerName.trim()) return

    // Generate a unique game code
    const gameCode = generateGameCode()

    // Generate word pair for the game
    const { normalWord, mafiaWord } = generateWordPair()

    // Create game state
    const gameState = {
      code: gameCode,
      host: playerName,
      playerCount,
      mafiaCount,
      players: [{ id: 1, name: playerName, isMafia: false }],
      normalWord,
      mafiaWord,
      status: "lobby", // lobby, playing, ended
      created: new Date().toISOString(),
    }

    // Store game in localStorage
    localStorage.setItem(`game_${gameCode}`, JSON.stringify(gameState))
    localStorage.setItem(
      "currentPlayer",
      JSON.stringify({
        id: 1,
        name: playerName,
        gameCode,
      }),
    )

    router.push(`/lobby?code=${gameCode}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>Set up your game parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            <Input
              id="playerName"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="playerCount">Number of Players</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPlayerCount(Math.max(3, playerCount - 1))}
                disabled={playerCount <= 3}
              >
                -
              </Button>
              <Input
                id="playerCount"
                type="number"
                min={3}
                max={20}
                value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
                className="text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPlayerCount(Math.min(20, playerCount + 1))}
                disabled={playerCount >= 20}
              >
                +
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mafiaCount">Number of Mafias</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMafiaCount(Math.max(1, mafiaCount - 1))}
                disabled={mafiaCount <= 1}
              >
                -
              </Button>
              <Input
                id="mafiaCount"
                type="number"
                min={1}
                max={Math.floor(playerCount / 2)}
                value={mafiaCount}
                onChange={(e) => setMafiaCount(Number(e.target.value))}
                className="text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMafiaCount(Math.min(Math.floor(playerCount / 2), mafiaCount + 1))}
                disabled={mafiaCount >= Math.floor(playerCount / 2)}
              >
                +
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum {Math.floor(playerCount / 2)} mafias for {playerCount} players
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push("/")} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleCreateGame} className="ml-auto" disabled={!playerName.trim()}>
            Create Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

