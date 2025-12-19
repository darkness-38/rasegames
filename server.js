const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// ===================================
// FIGHT ARENA - GAME ROOMS MANAGEMENT
// ===================================

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

    return room;
}

function joinRoom(code, guestId) {
    const room = rooms.get(code);
    if (!room) return { error: 'Oda bulunamadı!' };
    if (room.guest) return { error: 'Oda dolu!' };
    if (room.host === guestId) return { error: 'Kendi odanıza katılamazsınız!' };

    room.guest = guestId;
    room.state = 'selecting';
    playerRooms.set(guestId, code);

    return { success: true, room };
}

function leaveRoom(playerId) {
    const code = playerRooms.get(playerId);
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    playerRooms.delete(playerId);

    if (room.host === playerId) {
        if (room.guest) {
            io.to(room.guest).emit('roomClosed', { reason: 'Host odadan ayrıldı' });
            playerRooms.delete(room.guest);
        }
        rooms.delete(code);
    } else if (room.guest === playerId) {
        room.guest = null;
        room.guestCharacter = null;
        room.guestReady = false;
        room.state = 'waiting';
        io.to(room.host).emit('guestLeft');
    }
}

// ===================================
// SOCKET.IO EVENTS
// ===================================

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create a new room
    socket.on('createRoom', () => {
        const room = createRoom(socket.id);
        socket.join(room.code);
        socket.emit('roomCreated', { code: room.code });
        console.log(`Room created: ${room.code} by ${socket.id}`);
    });

    // Join existing room
    socket.on('joinRoom', (code) => {
        const result = joinRoom(code.toUpperCase(), socket.id);

        if (result.error) {
            socket.emit('joinError', { message: result.error });
            return;
        }

        socket.join(code);
        socket.emit('joinedRoom', { code, isHost: false });
        io.to(result.room.host).emit('guestJoined', { guestId: socket.id });
        io.to(code).emit('goToCharacterSelect');
        console.log(`Player ${socket.id} joined room ${code}`);
    });

    // Character selection
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

    // Arena selection (host only)
    socket.on('selectArena', ({ arena }) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room || room.host !== socket.id) return;

        room.arena = arena;
        io.to(code).emit('arenaSelected', { arena });
    });

    // Player ready
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

    // Game input sync
    socket.on('playerInput', (inputData) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;
        socket.to(code).emit('opponentInput', inputData);
    });

    // Game state sync
    socket.on('gameStateSync', (state) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room || room.host !== socket.id) return;

        room.gameState = state;
        socket.to(code).emit('gameStateUpdate', state);
    });

    // Round end
    socket.on('roundEnd', (data) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;
        socket.to(code).emit('roundEnded', data);
    });

    // Match end
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

    // Rematch request
    socket.on('requestRematch', () => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        const room = rooms.get(code);
        if (!room) return;

        if (room.host === socket.id) {
            room.hostReady = true;
        } else {
            room.guestReady = true;
        }

        socket.to(code).emit('rematchRequested');

        if (room.hostReady && room.guestReady) {
            room.state = 'playing';
            room.hostReady = false;
            room.guestReady = false;
            io.to(code).emit('startRematch');
        }
    });

    // Chat message
    socket.on('chatMessage', (message) => {
        const code = playerRooms.get(socket.id);
        if (!code) return;

        socket.to(code).emit('chatMessage', {
            from: socket.id,
            message: message.substring(0, 100)
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        leaveRoom(socket.id);
    });

    // Leave room manually
    socket.on('leaveRoom', () => {
        leaveRoom(socket.id);
    });
});

// ===================================
// START SERVER
// ===================================

server.listen(PORT, () => {
    console.log(`🎮 Rase Games Server running on port ${PORT}`);
    console.log(`   Open http://localhost:${PORT} in your browser`);
});
