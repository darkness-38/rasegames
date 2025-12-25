const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { filterBadWords } = require('./utils/profanityFilter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket'], // Force WebSocket only (disable polling for speed)
    pingTimeout: 60000,
    pingInterval: 25000,
    perMessageDeflate: false // Disable compression for lower CPU/latency
});

const PORT = process.env.PORT || 3000;

// Redirect .html URLs to clean URLs (with validation to prevent open redirects)
app.use((req, res, next) => {
    const url = req.url;

    // Security: Only process paths, not full URLs with protocols
    // Reject any URL that looks like an absolute URL or contains dangerous characters
    if (url.includes('://') || url.includes('//') || url.startsWith('\\')) {
        return next();
    }

    // Redirect /path/index.html to /path/
    if (url.endsWith('/index.html')) {
        const cleanPath = url.slice(0, -10);
        // Validate the resulting path is safe (starts with / and has no protocol)
        if (cleanPath.startsWith('/') && !cleanPath.includes('://')) {
            return res.redirect(301, cleanPath);
        }
    }

    // Redirect /path.html to /path
    if (url.endsWith('.html') && !url.includes('/index.html')) {
        const cleanPath = url.slice(0, -5);
        if (cleanPath.startsWith('/') && !cleanPath.includes('://')) {
            return res.redirect(301, cleanPath);
        }
    }

    next();
});

// Simple in-memory rate limiting for DoS protection
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 200; // max requests per window per IP

const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, startTime: now });
    } else {
        const record = rateLimit.get(ip);
        if (now - record.startTime > RATE_LIMIT_WINDOW) {
            rateLimit.set(ip, { count: 1, startTime: now });
        } else if (record.count >= RATE_LIMIT_MAX) {
            return res.status(429).send('Too many requests');
        } else {
            record.count++;
        }
    }
    next();
};

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimit.entries()) {
        if (now - record.startTime > RATE_LIMIT_WINDOW * 2) {
            rateLimit.delete(ip);
        }
    }
}, 300000);

// Apply rate limiting
app.use(rateLimiter);

// Redirect old page URLs to new pages/ folder
const pageRedirects = ['profile', 'games', 'challenges', 'leaderboard', 'about'];
pageRedirects.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.redirect(301, `/pages/${page}`);
    });
});

// Redirect old game URLs to new games/ folder
const gameRedirects = ['game2048', 'snakeGame', 'tetrisGame', 'flappyGame', 'memoryGame', 'minesweeperGame', 'tictactoeGame', 'raseClicker', 'runnerGame', 'fightArena', 'battleshipGame'];
gameRedirects.forEach(game => {
    app.get(`/${game}`, (req, res) => {
        res.redirect(301, `/games/${game}`);
    });
    app.get(`/${game}/`, (req, res) => {
        res.redirect(301, `/games/${game}/`);
    });
});

// Serve static files with extensions option to enable clean URLs
app.use(express.static(path.join(__dirname), {
    extensions: ['html']
}));

// Fallback: serve index.html for directory paths
app.get(/^(.*)$/, (req, res, next) => {
    // Security: Normalize and validate path to prevent directory traversal
    const requestedPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, requestedPath, 'index.html');

    // Ensure the resolved path is still within __dirname (prevent path traversal)
    if (!filePath.startsWith(__dirname)) {
        return res.status(403).send('Forbidden');
    }

    res.sendFile(filePath, (err) => {
        if (err) next();
    });
});

// 404 Error Handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'pages', '404.html'));
});





const rooms = new Map();
const playerRooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createRoom(hostId) {
    let code = generateRoomCode();
    while (rooms.has(code)) {
        code = generateRoomCode();
    }

    const room = {
        code,
        host: hostId,
        guest: null,
        hostCharacter: null,
        guestCharacter: null,
        arena: 'dojo',
        state: 'waiting',
        gameState: null,
        hostReady: false,
        guestReady: false
    };

    rooms.set(code, room);
    playerRooms.set(hostId, code);

    console.log(`[ROOM] Created new room: "${code}" for host: ${hostId}`);
    return room;
}

// Log active rooms every 30 seconds
setInterval(() => {
    console.log(`[STATUS] Active rooms (${rooms.size}):`, Array.from(rooms.keys()));
    console.log(`[STATUS] Connected players in rooms:`, playerRooms.size);
}, 30000);

function joinRoom(code, guestId) {
    console.log(`[JOIN] Attempting to join room: "${code}"`);
    console.log(`[JOIN] Available rooms:`, Array.from(rooms.keys()));

    const room = rooms.get(code);
    if (!room) {
        console.log(`[JOIN] Room not found: "${code}"`);
        return { error: 'Room not found!' };
    }
    if (room.guest) return { error: 'Room is full!' };
    if (room.host === guestId) return { error: 'You cannot join your own room!' };

    room.guest = guestId;
    room.state = 'selecting';
    playerRooms.set(guestId, code);

    broadcastRoomList(); // Update list (room is now full/selecting)
    return { success: true, room };
}

function leaveRoom(playerId) {
    const code = playerRooms.get(playerId);
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    playerRooms.delete(playerId);

    // If game hasn't started yet (lobby), close entire room
    if (room.state === 'waiting' || room.state === 'selecting') {

        // If Host leaves
        if (room.host === playerId) {
            console.log(`[ROOM] Host left room ${code}. Deleting immediately. (User requested no grace period)`);

            if (room.guest) {
                io.to(room.guest).emit('roomClosed', { reason: 'Host disconnected' });
                playerRooms.delete(room.guest);
            }
            rooms.delete(code);
            broadcastRoomList();

            // If Guest leaves
        } else if (room.guest === playerId) {
            console.log(`[ROOM] Guest left room ${code}. Removing guest.`);
            room.guest = null;
            room.guestCharacter = null;
            room.guestReady = false;

            io.to(room.host).emit('guestLeft');
            // Do NOT close the room, let host wait for new guest
        }

        return;
    }

    // During game, handle normally
    if (room.host === playerId) {
        if (room.guest) {
            io.to(room.guest).emit('roomClosed', { reason: 'Host left the room' });
            playerRooms.delete(room.guest);
        }
        rooms.delete(code);
    } else if (room.guest === playerId) {
        io.to(room.host).emit('roomClosed', { reason: 'Opponent left the room' });
        playerRooms.delete(room.host);
        rooms.delete(code);
    }
}





io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);


    socket.on('createRoom', () => {
        const room = createRoom(socket.id);
        socket.join(room.code);
        socket.emit('roomCreated', { code: room.code });
        console.log(`Room created: ${room.code} by ${socket.id}`);
    });


    socket.on('joinRoom', (code) => {
        const upperCode = code.toUpperCase();
        const roomCount = rooms.size;
        const availableRooms = Array.from(rooms.keys());

        console.log(`[JOIN] Socket ${socket.id} trying to join: "${upperCode}"`);
        console.log(`[JOIN] Total rooms on server: ${roomCount}`);
        console.log(`[JOIN] Available room codes:`, availableRooms);

        // Send debug info to client
        socket.emit('debugInfo', {
            action: 'joinAttempt',
            requestedCode: upperCode,
            availableRooms: availableRooms,
            roomCount: roomCount
        });

        const result = joinRoom(upperCode, socket.id);

        if (result.error) {
            console.log(`[JOIN] Error: ${result.error}`);
            socket.emit('joinError', { message: result.error, debug: { availableRooms, requestedCode: upperCode } });
            return;
        }

        socket.join(upperCode);
        socket.emit('joinedRoom', { code: upperCode, isHost: false });
        io.to(result.room.host).emit('guestJoined', { guestId: socket.id });
        io.to(upperCode).emit('goToCharacterSelect');
        console.log(`[JOIN] SUCCESS: Player ${socket.id} joined room ${upperCode}`);
    });


    socket.on('selectCharacter', ({ character }) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room) return;

        if (room.host === socket.id) {
            room.hostCharacter = character;
        } else if (room.guest === socket.id) {
            room.guestCharacter = character;
        }

        socket.to(code).emit('opponentSelectedCharacter', { character });
    });


    socket.on('selectArena', ({ arena }) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room || room.host !== socket.id) return;

        room.arena = arena;
        io.to(code).emit('arenaSelected', { arena });
    });


    socket.on('playerReady', () => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room) return;

        if (room.host === socket.id) {
            room.hostReady = true;
        } else if (room.guest === socket.id) {
            room.guestReady = true;
        }

        socket.to(code).emit('opponentReady');

        if (room.hostReady && room.guestReady && room.hostCharacter && room.guestCharacter) {
            room.state = 'playing';
            io.to(code).emit('startOnlineGame', {
                hostCharacter: room.hostCharacter,
                guestCharacter: room.guestCharacter,
                arena: room.arena
            });
        }
    });


    socket.on('playerInput', (inputData) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;
        socket.to(code).emit('opponentInput', inputData);
    });

    socket.on('playerPosition', (posData) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;
        socket.to(code).emit('opponentPosition', posData);
    });


    socket.on('gameStateSync', (state) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room || room.host !== socket.id) return;

        room.gameState = state;
        socket.to(code).emit('gameStateUpdate', state);
    });


    socket.on('roundEnd', (data) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;
        socket.to(code).emit('roundEnded', data);
    });


    socket.on('matchEnd', (data) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (room) {
            room.state = 'finished';
            room.hostReady = false;
            room.guestReady = false;
        }

        socket.to(code).emit('matchEnded', data);
    });


    socket.on('requestRematch', () => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room) return;

        // Mark who requested rematch
        if (room.host === socket.id) {
            room.hostWantsRematch = true;
        } else {
            room.guestWantsRematch = true;
        }

        // Send rematch request to opponent
        socket.to(code).emit('rematchRequested', { from: socket.id });
    });

    socket.on('acceptRematch', () => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room) return;

        // Both players want rematch, start it
        room.state = 'playing';
        room.hostWantsRematch = false;
        room.guestWantsRematch = false;
        room.hostReady = false;
        room.guestReady = false;
        io.to(code).emit('startRematch');
    });

    socket.on('declineRematch', () => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room) return;

        // Notify both players and close room
        io.to(code).emit('rematchDeclined');

        if (room.host) playerRooms.delete(room.host);
        if (room.guest) playerRooms.delete(room.guest);
        rooms.delete(code);
    });


    socket.on('chatMessage', (message) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        // Apply profanity filter
        const cleanMessage = filterBadWords(message);

        socket.to(code).emit('chatMessage', {
            from: socket.id,
            message: cleanMessage.substring(0, 100)
        });
    });


    socket.on('getRooms', () => {
        const roomList = Array.from(rooms.values())
            .filter(r => r.state === 'waiting' || r.state === 'selecting')
            .map(r => ({
                code: r.code,
                host: r.host, // Send host ID (or name if we had it)
                playerCount: (r.host ? 1 : 0) + (r.guest ? 1 : 0)
            }));
        socket.emit('roomList', roomList);
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        leaveRoom(socket.id);
        broadcastRoomList(); // Update list on disconnect
    });


    socket.on('leaveRoom', () => {
        leaveRoom(socket.id);
        broadcastRoomList(); // Update list on leave
    });
});


function broadcastRoomList() {
    const roomList = Array.from(rooms.values())
        .filter(r => r.state === 'waiting' || r.state === 'selecting')
        .map(r => ({
            code: r.code,
            host: r.host,
            playerCount: (r.host ? 1 : 0) + (r.guest ? 1 : 0)
        }));
    // Broadcast to everyone (or just lobby? keeping it simple for now)
    io.emit('roomListUpdate', roomList);
}





// ============================================
// BATTLESHIP GAME LOGIC
// ============================================

const battleshipRooms = new Map();
const battleshipPlayerRooms = new Map();

function generateBattleshipRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createBattleshipRoom(hostId) {
    let code = generateBattleshipRoomCode();
    while (battleshipRooms.has(code)) {
        code = generateBattleshipRoomCode();
    }

    const room = {
        code,
        host: hostId,
        guest: null,
        hostGrid: null,
        guestGrid: null,
        hostShips: null,
        guestShips: null,
        hostReady: false,
        guestReady: false,
        currentTurn: null,
        state: 'waiting', // waiting, placement, battle, finished
        hostShotsFired: 0,
        guestShotsFired: 0
    };

    battleshipRooms.set(code, room);
    battleshipPlayerRooms.set(hostId, code);

    console.log(`[BATTLESHIP] Created room: ${code} by ${hostId}`);
    return room;
}

function checkShipSunk(grid, ships, shipId) {
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return false;

    return ship.cells.every(([row, col]) => {
        return grid[row][col].hit === true;
    });
}

function checkAllShipsSunk(ships) {
    return ships.every(ship => ship.sunk === true);
}

function broadcastBattleshipRoomList() {
    const roomList = Array.from(battleshipRooms.values())
        .filter(r => r.state === 'waiting')
        .map(r => ({
            code: r.code,
            host: r.host
        }));
    io.emit('battleship:roomList', roomList);
}

// Battleship socket events
io.on('connection', (socket) => {
    // Get room list
    socket.on('battleship:getRooms', () => {
        const roomList = Array.from(battleshipRooms.values())
            .filter(r => r.state === 'waiting')
            .map(r => ({
                code: r.code,
                host: r.host
            }));
        socket.emit('battleship:roomList', roomList);
    });

    // Create room
    socket.on('battleship:createRoom', () => {
        // Leave any existing room first
        const existingCode = battleshipPlayerRooms.get(socket.id);
        if (existingCode) {
            leaveBattleshipRoom(socket.id);
        }

        const room = createBattleshipRoom(socket.id);
        socket.join(`battleship:${room.code}`);
        socket.emit('battleship:roomCreated', { code: room.code });
        broadcastBattleshipRoomList();
    });

    // Join room
    socket.on('battleship:joinRoom', (code) => {
        const upperCode = code.toUpperCase();
        const room = battleshipRooms.get(upperCode);

        if (!room) {
            socket.emit('battleship:joinError', { message: 'Room not found!' });
            return;
        }
        if (room.guest) {
            socket.emit('battleship:joinError', { message: 'Room is full!' });
            return;
        }
        if (room.host === socket.id) {
            socket.emit('battleship:joinError', { message: 'Cannot join your own room!' });
            return;
        }

        room.guest = socket.id;
        room.state = 'placement';
        battleshipPlayerRooms.set(socket.id, upperCode);

        socket.join(`battleship:${upperCode}`);

        // Randomly decide who goes first
        room.currentTurn = Math.random() > 0.5 ? room.host : room.guest;

        // Notify both players to go to placement phase
        io.to(`battleship:${upperCode}`).emit('battleship:gameStart', {
            firstTurn: room.currentTurn
        });

        broadcastBattleshipRoomList();
        console.log(`[BATTLESHIP] ${socket.id} joined room ${upperCode}`);
    });

    // Player ready (ships placed)
    socket.on('battleship:ready', (data) => {
        const code = battleshipPlayerRooms.get(socket.id);
        if (!code) return;

        const room = battleshipRooms.get(code);
        if (!room) return;

        if (room.host === socket.id) {
            room.hostReady = true;
            room.hostGrid = data.grid;
            room.hostShips = data.ships;
        } else if (room.guest === socket.id) {
            room.guestReady = true;
            room.guestGrid = data.grid;
            room.guestShips = data.ships;
        }

        // Notify opponent
        socket.to(`battleship:${code}`).emit('battleship:opponentReady');

        // Check if both ready
        if (room.hostReady && room.guestReady) {
            room.state = 'battle';
            io.to(`battleship:${code}`).emit('battleship:battleStart', {
                firstTurn: room.currentTurn
            });
            console.log(`[BATTLESHIP] Battle started in room ${code}`);
        }
    });

    // Attack
    socket.on('battleship:attack', (data) => {
        const code = battleshipPlayerRooms.get(socket.id);
        if (!code) return;

        const room = battleshipRooms.get(code);
        if (!room || room.state !== 'battle') return;

        // Verify it's the player's turn
        if (room.currentTurn !== socket.id) return;

        const { row, col } = data;
        const isHost = room.host === socket.id;
        const targetGrid = isHost ? room.guestGrid : room.hostGrid;
        const targetShips = isHost ? room.guestShips : room.hostShips;

        // Track shots
        if (isHost) {
            room.hostShotsFired++;
        } else {
            room.guestShotsFired++;
        }

        const cell = targetGrid[row][col];
        let result = 'miss';
        let shipId = null;
        let sunk = false;

        if (cell.type === 'ship') {
            result = 'hit';
            shipId = cell.shipId;
            targetGrid[row][col].hit = true;

            // Check if ship is sunk
            const ship = targetShips.find(s => s.id === shipId);
            if (ship) {
                const allCellsHit = ship.cells.every(([r, c]) => targetGrid[r][c].hit === true);
                if (allCellsHit) {
                    sunk = true;
                    ship.sunk = true;
                }
            }
        }

        // Send result to attacker
        socket.emit('battleship:attackResult', { row, col, result, shipId, sunk });

        // Send attack info to defender
        socket.to(`battleship:${code}`).emit('battleship:opponentAttack', { row, col, result, shipId, sunk });

        // Check for game over
        const allSunk = targetShips.every(s => s.sunk === true);
        if (allSunk) {
            room.state = 'finished';
            io.to(`battleship:${code}`).emit('battleship:gameOver', {
                winner: socket.id,
                stats: {
                    hostShots: room.hostShotsFired,
                    guestShots: room.guestShotsFired
                }
            });
            console.log(`[BATTLESHIP] Game over in room ${code}. Winner: ${socket.id}`);
        } else {
            // Switch turns
            room.currentTurn = isHost ? room.guest : room.host;
        }
    });

    // Request rematch
    socket.on('battleship:requestRematch', () => {
        const code = battleshipPlayerRooms.get(socket.id);
        if (!code) return;

        const room = battleshipRooms.get(code);
        if (!room) return;

        if (room.host === socket.id) {
            room.hostWantsRematch = true;
        } else {
            room.guestWantsRematch = true;
        }

        socket.to(`battleship:${code}`).emit('battleship:rematchRequested');

        // Check if both want rematch
        if (room.hostWantsRematch && room.guestWantsRematch) {
            // Reset room state
            room.hostGrid = null;
            room.guestGrid = null;
            room.hostShips = null;
            room.guestShips = null;
            room.hostReady = false;
            room.guestReady = false;
            room.state = 'placement';
            room.hostWantsRematch = false;
            room.guestWantsRematch = false;
            room.hostShotsFired = 0;
            room.guestShotsFired = 0;
            room.currentTurn = Math.random() > 0.5 ? room.host : room.guest;

            io.to(`battleship:${code}`).emit('battleship:rematchAccepted');
        }
    });

    // Chat Message
    socket.on('battleship:chatMessage', (message) => {
        const code = battleshipPlayerRooms.get(socket.id);
        if (!code) return;

        // Apply profanity filter
        const cleanMessage = filterBadWords(message);

        socket.to(`battleship:${code}`).emit('battleship:chatMessage', {
            from: socket.id,
            message: cleanMessage.substring(0, 100)
        });
    });

    // Surrender
    socket.on('battleship:surrender', () => {
        console.log(`[BATTLESHIP] Surrender received from ${socket.id}`);
        const code = battleshipPlayerRooms.get(socket.id);
        if (!code) {
            console.log('[BATTLESHIP] Surrender failed: Player not in a room');
            return;
        }

        const room = battleshipRooms.get(code);
        if (!room) {
            console.log('[BATTLESHIP] Surrender failed: Room not found');
            return;
        }

        const winner = room.host === socket.id ? room.guest : room.host;

        // Calculate stats (optional, could be improved)
        const stats = {
            shots: 0,
            accuracy: 0
        };

        io.to(`battleship:${code}`).emit('battleship:gameOver', {
            winner: winner,
            stats: stats,
            reason: 'surrender'
        });

        // Reset room state for possible rematch
        room.state = 'gameover';
    });

    // Leave room
    socket.on('battleship:leaveRoom', () => {
        leaveBattleshipRoom(socket.id);
    });

    // Handle disconnect for battleship
    socket.on('disconnect', () => {
        leaveBattleshipRoom(socket.id);
    });
});

function leaveBattleshipRoom(playerId) {
    const code = battleshipPlayerRooms.get(playerId);
    if (!code) return;

    const room = battleshipRooms.get(code);
    if (!room) return;

    battleshipPlayerRooms.delete(playerId);

    if (room.host === playerId) {
        // Host left, close room
        if (room.guest) {
            io.to(room.guest).emit('battleship:opponentLeft');
            battleshipPlayerRooms.delete(room.guest);
        }
        battleshipRooms.delete(code);
    } else if (room.guest === playerId) {
        // Guest left
        if (room.state === 'waiting' || room.state === 'placement') {
            // Room can continue waiting for new guest
            room.guest = null;
            room.guestReady = false;
            room.guestGrid = null;
            room.guestShips = null;
            room.state = 'waiting';
            io.to(room.host).emit('battleship:opponentLeft');
        } else {
            // Mid-game, notify host
            io.to(room.host).emit('battleship:opponentLeft');
            battleshipPlayerRooms.delete(room.host);
            battleshipRooms.delete(code);
        }
    }

    broadcastBattleshipRoomList();
    console.log(`[BATTLESHIP] Player ${playerId} left room ${code}`);
}


server.listen(PORT, () => {
    console.log(`Rase Games Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
