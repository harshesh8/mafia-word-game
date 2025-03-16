# Word Mafia Game

A real-time word association game where players try to identify the mafias among them. Built with Next.js and localStorage for state management.

## How to Play

1. One player creates a game and gets a game code
2. They share the code with other players
3. Players join using the code
4. The host starts the game when everyone is ready
5. Each player gets a word:
   - Civilians get one word
   - Mafias get a different word
6. Players discuss in person, trying to figure out who has the different word
7. Players vote on who they think are the mafias

## Features

- Create and join games with unique codes
- Real-time player updates in lobby
- Support for 3-20 players
- Configurable number of mafias
- Simple and intuitive UI

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/ui
- LocalStorage for state management

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The game is deployed on Vercel and can be played at: [Your-URL-Here]

## Contributing

Feel free to open issues and pull requests! 