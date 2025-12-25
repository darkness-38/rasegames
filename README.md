# 🎮 Rase Games

<div align="center">

**A collection of modern web games with stunning visuals, real-time multiplayer, and competitive features.**

[![Games](https://img.shields.io/badge/🕹️_Games-10-4f46e5?style=for-the-badge)](https://rasegames.qzz.io)
[![Firebase](https://img.shields.io/badge/🔥_Firebase-Backend-orange?style=for-the-badge)](https://firebase.google.com)
[![TailwindCSS](https://img.shields.io/badge/💨_Tailwind-CSS-06B6D4?style=for-the-badge)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/⚡_Socket.io-Multiplayer-green?style=for-the-badge)](https://socket.io)

[🎯 Play Now](https://rasegames.qzz.io) • [📖 Documentation](#-getting-started) • [🐛 Report Bug](https://github.com/darkness-38/rasegames/issues)

</div>

---

## 🌟 Why Rase Games?

> *"Not just games. A gaming experience."*

- 🎨 **Beautiful UI** - Neon cyberpunk aesthetic with smooth animations
- ⚡ **Instant Play** - No downloads, no installations, just play
- 🏆 **Compete Globally** - Real-time leaderboards for every game
- 📈 **Track Progress** - Daily challenges with XP rewards and leveling system
- 🌐 **Cross-Platform** - Play on desktop or mobile, your progress syncs everywhere

---

## 🕹️ Game Collection

<table>
<tr>
<td align="center" width="33%">

### 💎 Rase Clicker
*Idle/Clicker*

Click your way to server domination. Unlock upgrades, hire hackers, and build your empire!

</td>
<td align="center" width="33%">

### ⚔️ Fight Arena
*Fighting/Multiplayer*

2D fighting game with unique characters. Battle friends online in real-time!

</td>
<td align="center" width="33%">

### 🏃 Cyber Runner
*Platformer*

Endless runner through a neon cityscape. Collect power-ups and beat your high score!

</td>
</tr>
<tr>
<td align="center">

### 🐍 Neon Snake
*Arcade*

Classic snake reimagined with stunning neon visuals and smooth controls.

</td>
<td align="center">

### 🧱 Cyber Blocks
*Puzzle*

Tetris with 3D effects, particle explosions, and cyberpunk style.

</td>
<td align="center">

### 🔢 Power 2048
*Puzzle*

Merge tiles strategically to reach 2048 and beyond!

</td>
</tr>
<tr>
<td align="center">

### 🐦 Pixel Bird
*Arcade*

Navigate through obstacles in this flappy bird-style challenge.

</td>
<td align="center">

### 💣 Bomb Squad
*Puzzle*

Classic minesweeper with a modern twist and satisfying sound effects.

</td>
<td align="center">

### 🃏 Mind Match
*Memory*

Test your memory with card matching. Beat the clock!

</td>
</tr>
</tr>
<tr>
<td align="center">

### ⭕ Tic Tac Pro
*Strategy*

Play against a smart AI opponent. Can you beat it on hard mode?

</td>
<td align="center">

### 🧩 Sudoku
*Puzzle*

Classic logic puzzle with multiple difficulties, note-taking, and hint system.

</td>
<td align="center">

### 🧪 RaseLab
*Education*

Interactive chemistry simulations. Explore atoms, molecules, and reactions!

</td>
</tr>
</table>

---

## ✨ Feature Highlights

### 🎯 Daily Challenges
Every day brings **3 new challenges** tailored to your level. Complete them to earn XP and climb the ranks!

```
🏆 Today's Challenges
├── 🐍 Snake: Score 50 points (+60 XP)
├── 🧱 Tetris: Clear 10 lines (+70 XP)
└── 💎 Clicker: Collect 100 diamonds (+75 XP)
```

### 📈 Leveling System

| Level | Title | Badge | Perks |
|:-----:|:-----:|:-----:|:------|
| 1-4 | Seedling | 🌱 | Basic challenges |
| 5-9 | Explorer | 🌿 | Harder challenges = More XP |
| 10-19 | Adventurer | 🌳 | Unlock achievements |
| 20-29 | Warrior | ⚔️ | Profile customization |
| 30-49 | Champion | 🏆 | Special badges |
| 50+ | **Legend** | 👑 | Legendary status |

### 🔐 Account System
- 📧 Email/Password registration
- 🔗 Google Sign-In
- 👤 Guest mode (play instantly, upgrade later!)
- ☁️ Cloud sync across all devices

### ⚔️ Real-Time Multiplayer
Fight Arena & Battleship feature **real-time online battles** powered by Socket.io:
- 🎮 Create or join rooms instantly
- 🥊 Choose your strategy
- 💬 **In-Game Chat** - Taunt your opponents or stratigize!
- 🤖 **VS CPU** - Practice against AI when offline

### 🧪 RaseLab Simulations
Explore interactive science experiments directly in your browser:
- ⚛️ **Orbitals** - 3D atomic visualization
- 💨 **Gas Laws** & **Effusion** - Particle physics simulations
- ⚖️ **Balancing Equations** - mastering stoichiometry

---

## 🛠️ Tech Stack

<table>
<tr>
<td><b>Frontend</b></td>
<td>HTML5, CSS3, Vanilla JavaScript</td>
</tr>
<tr>
<td><b>Styling</b></td>
<td>Tailwind CSS + Custom Animations</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>Firebase (Auth, Realtime Database)</td>
</tr>
<tr>
<td><b>Server</b></td>
<td>Express.js + Socket.io</td>
</tr>
<tr>
<td><b>Hosting</b></td>
<td>Render (Server) / Static Hosting</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+
npm or yarn
```

### Quick Start

```bash
# Clone the repository
git clone https://github.com/darkness-38/rasegames.git
cd rasegames

# Install dependencies
npm install

# Start development server
npm start
```

Open `http://localhost:3000` in your browser 🎮

### Firebase Setup
Update `scripts/firebase-config.js` with your own Firebase credentials for production use.

---

## 📁 Project Structure

```
rasegames/
│
├── 🏠 index.html              # Homepage
│
├── 📄 pages/                   # HTML Pages
│   ├── games.html              # Game library
│   ├── challenges.html         # Daily challenges
│   ├── profile.html            # User profile
│   ├── leaderboard.html        # Rankings
│   └── ...
│
├── 🔧 scripts/                 # JavaScript
│   ├── auth.js                 # Authentication
│   ├── challenges.js           # XP & Challenges
│   ├── leaderboard.js          # Leaderboard logic
│   └── ...
│
├── 🎨 styles/                  # CSS
│   ├── style.css               # Global styles
│   └── ...
│
├── 🎮 games/                   # Game Folders
│   ├── game2048/
│   ├── snakeGame/
│   ├── tetrisGame/
│   ├── fightArena/             # Multiplayer game
│   └── ...
│
├── 🔊 assets/sounds/           # Audio files
│
└── ⚙️ server.js                # Express + Socket.io
```

---

## 🎮 Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move | Arrow Keys / WASD | D-Pad / Swipe |
| Jump | Space | Jump Button |
| Attack | J / K / L | Attack Buttons |
| Pause | Escape | Pause Button |

---

## 🏆 Leaderboards

- 📊 **Per-Game Rankings** - Compete separately in each game
- 🥇 **Only Highest Score** - Your best performance counts
- 🔄 **Real-Time Updates** - See scores update instantly
- 👤 **Profile Sync** - Username changes reflect everywhere

---

## 👤 Profile Features

<table>
<tr>
<td width="50%">

**Identity Card**
- Custom emoji avatars (18 options)
- Editable username
- Level badge display
- Rank indicator

</td>
<td width="50%">

**Stats Dashboard**
- Total XP earned
- Challenges completed
- Current level progress
- Daily progress tracker

</td>
</tr>
</table>

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Made with ❤️ by Rase Corporation

**[🎮 Play Now](https://rasegames.qzz.io)** • **[⭐ Star this repo](https://github.com/darkness-38/rasegames)**

</div>
