// Generate a random 6-character game code
export function generateGameCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Word pairs for the game
const wordPairs = [
  { normalWord: "Apple", mafiaWord: "Orange" },
  { normalWord: "Dog", mafiaWord: "Cat" },
  { normalWord: "Beach", mafiaWord: "Mountain" },
  { normalWord: "Summer", mafiaWord: "Winter" },
  { normalWord: "Coffee", mafiaWord: "Tea" },
  { normalWord: "Pizza", mafiaWord: "Burger" },
  { normalWord: "Soccer", mafiaWord: "Basketball" },
  { normalWord: "Movie", mafiaWord: "Book" },
  { normalWord: "Guitar", mafiaWord: "Piano" },
  { normalWord: "Car", mafiaWord: "Bicycle" },
  { normalWord: "Morning", mafiaWord: "Evening" },
  { normalWord: "Sun", mafiaWord: "Moon" },
  { normalWord: "River", mafiaWord: "Lake" },
  { normalWord: "Forest", mafiaWord: "Desert" },
  { normalWord: "Pencil", mafiaWord: "Pen" },
  { normalWord: "Shirt", mafiaWord: "Pants" },
  { normalWord: "Happy", mafiaWord: "Sad" },
  { normalWord: "Fast", mafiaWord: "Slow" },
  { normalWord: "Hot", mafiaWord: "Cold" },
  { normalWord: "Sweet", mafiaWord: "Sour" },
]

// Generate a random word pair for the game
export function generateWordPair() {
  const randomIndex = Math.floor(Math.random() * wordPairs.length)
  return wordPairs[randomIndex]
}

