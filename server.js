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
    },
    transports: ['websocket'], // Force WebSocket only (disable polling for speed)
    pingTimeout: 60000,
    pingInterval: 25000,
    perMessageDeflate: false // Disable compression for lower CPU/latency
});

const PORT = process.env.PORT || 3000;

// Serve static files with extensions option to enable clean URLs
app.use(express.static(path.join(__dirname), {
    extensions: ['html']
}));

// Fallback: serve index.html for directory paths
app.get(/^(.*)$/, (req, res, next) => {
    const filePath = path.join(__dirname, req.path, 'index.html');
    res.sendFile(filePath, (err) => {
        if (err) next();
    });
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
        return { error: 'Oda bulunamadı!' };
    }
    if (room.guest) return { error: 'Oda dolu!' };
    if (room.host === guestId) return { error: 'Kendi odana katılamazsın!' };

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
    // If game hasn't started yet (lobby)
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

        socket.to(code).emit('chatMessage', {
            from: socket.id,
            message: message.substring(0, 100)
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





server.listen(PORT, () => {
    console.log(`Rase Games Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
