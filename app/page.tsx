"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function HomePage() {
  const router = useRouter()
  const [gameCode, setGameCode] = useState("")

  const handleCreateGame = () => {
    router.push("/create-game")
  }

  const handleJoinGame = () => {
    if (gameCode.trim()) {
      // Check if game exists
      const gameState = localStorage.getItem(`game_${gameCode.trim()}`)
      if (!gameState) {
        alert("Game not found. Please check the code and try again.")
        return
      }

      const parsedGame = JSON.parse(gameState)
      if (parsedGame.status !== "lobby") {
        alert("This game has already started. You cannot join now.")
        return
      }

      if (parsedGame.players.length >= parsedGame.playerCount) {
        alert("This game is full. You cannot join.")
        return
      }

      router.push(`/lobby?code=${gameCode.trim()}`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Word Mafia</CardTitle>
          <CardDescription>A game of deception and word association</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Button onClick={handleCreateGame} className="w-full text-lg py-6" size="lg">
              Create New Game
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or join existing game</span>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Enter game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              className="text-center text-lg py-6"
            />
            <Button onClick={handleJoinGame} variant="outline" className="w-full" disabled={!gameCode.trim()}>
              Join Game
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Created by players, for players
        </CardFooter>
      </Card>
    </div>
  )
}

