# 🎮 Rase Games

A collection of modern web games with a sleek cyberpunk aesthetic, user authentication, daily challenges, and global leaderboards.

![Games](https://img.shields.io/badge/Games-10-blue)
![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)
![TailwindCSS](https://img.shields.io/badge/CSS-TailwindCSS-06B6D4)

## 🕹️ Available Games

| Game | Description | Type |
|------|-------------|------|
| **💎 Rase Clicker** | Click your way to server domination | Idle/Clicker |
| **🐍 Neon Snake** | Classic snake with neon visuals | Arcade |
| **🧱 Cyber Blocks** | Tetris with 3D effects & particles | Puzzle |
| **🏃 Cyber Runner** | Infinite runner with upgrades | Platformer |
| **🐦 Pixel Bird** | Flappy bird clone | Arcade |
| **💣 Bomb Squad** | Minesweeper challenge | Puzzle |
| **🃏 Mind Match** | Memory card matching | Puzzle |
| **🔢 Power 2048** | Merge tiles to 2048 | Puzzle |
| **⭕ Tic Tac Pro** | Tic-tac-toe vs AI | Strategy |
| **⚔️ Fight Arena** | 2D fighting with multiplayer | Fighting |

## ✨ Features

- 🔐 **User Authentication** - Firebase Auth (email/password + Google + anonymous)
- 🏆 **Global Leaderboards** - Compete with players worldwide
- 🎯 **Daily Challenges** - 3 unique challenges every day with XP rewards
- 📈 **Leveling System** - Earn XP and level up with unique badges
- 💾 **Cloud Saves** - Progress synced across devices
- 📱 **Mobile Responsive** - Touch controls for all games
- 🎨 **Modern UI** - Neon/cyberpunk theme with Tailwind CSS
- 🔊 **Sound Effects** - Immersive audio feedback

## 🎯 Daily Challenges System

- **3 Daily Challenges** - New challenges every day at midnight
- **Game-Specific Goals** - Score points, collect items, win matches
- **XP Rewards** - Complete challenges to earn experience points
- **Difficulty Scaling** - Challenges scale based on your level
- **Progress Tracking** - Track completion in real-time

### Level Progression

| Level | XP Required | Title | Badge |
|-------|-------------|-------|-------|
| 1-4 | 0-300 | Seedling | 🌱 |
| 5-9 | 300-900 | Explorer | 🌿 |
| 10-19 | 900-2400 | Adventurer | 🌳 |
| 20-29 | 2400-4900 | Warrior | ⚔️ |
| 30-49 | 4900-12400 | Champion | 🏆 |
| 50+ | 12400+ | Legend | 👑 |

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Realtime Database)
- **Hosting**: Render / Static hosting
- **Multiplayer**: Socket.io (Fight Arena)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/darkness-38/rasegames.git
cd rasegames

# Install dependencies
npm install

# Start development server
npm start
```

The server will start at `http://localhost:3000`

### Environment Setup

Firebase config is stored in `firebase-config.js`. Update with your own credentials for production.

## 📁 Project Structure

```
rasegames/
├── index.html          # Homepage with game cards
├── challenges.html     # Daily challenges page
├── challenges.js       # Challenge system logic
├── profile.html        # User profile page
├── auth.js             # Firebase authentication
├── auth.css            # Auth modal styles
├── leaderboard.js      # Global leaderboard system
├── sounds.js           # Sound effects manager
├── server.js           # Express + Socket.io server
├── style.css           # Global styles
│
├── snakeGame/          # Neon Snake
├── tetrisGame/         # Cyber Blocks
├── raseClicker/        # Clicker Game
├── runnerGame/         # Cyber Runner
├── flappyGame/         # Pixel Bird
├── minesweeperGame/    # Bomb Squad
├── memoryGame/         # Mind Match
├── game2048/           # Power 2048
├── tictactoeGame/      # Tic Tac Pro
└── fightArena/         # Fight Arena (Multiplayer)
```

## 🎮 Controls

### Keyboard
- **Arrow Keys / WASD** - Movement
- **Space** - Jump / Hard Drop / Action
- **C** - Hold piece (Tetris)

### Touch (Mobile)
- On-screen D-pad for all games
- Swipe gestures for Snake

## 🏆 Leaderboard System

- Only registered users can submit scores
- Each user keeps only their highest score per game
- Username updates sync across all leaderboard entries
- Real-time score updates with Firebase

## 👤 User Profile

- **Custom Avatars** - Choose from 18 emoji avatars
- **Username Customization** - Edit your display name
- **Level Progress** - Visual XP bar and level display
- **Stats Dashboard** - Total XP, challenges completed, rank
- **Quick Play** - Direct links to favorite games

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss changes.

---

Made with ❤️ by Rase Corporation
