




class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isHost = false;
        this.roomCode = null;
        this.opponentCharacter = null;
        this.opponentReady = false;


        this.onConnectionChange = null;
        this.onRoomCreated = null;
        this.onJoinedRoom = null;
        this.onJoinError = null;
        this.onGuestJoined = null;
        this.onGuestLeft = null;
        this.onRoomClosed = null;
        this.onGoToCharacterSelect = null;
        this.onOpponentSelectedCharacter = null;
        this.onArenaSelected = null;
        this.onOpponentReady = null;
        this.onStartGame = null;
        this.onOpponentInput = null;
        this.onOpponentPosition = null;
        this.onGameStateUpdate = null;
        this.onRoundEnded = null;
        this.onMatchEnded = null;
        this.onRematchRequested = null;
        this.onRematchDeclined = null;
        this.onStartRematch = null;
        this.onChatMessage = null;
    }

    connect() {
        if (this.socket) return;

        // Determine server URL - use current origin for same-domain deployment
        // If running on localhost without explicit port, use current origin
        const serverUrl = window.location.origin;

        console.log('Connecting to server:', serverUrl);

        // Connect to the server with WebSocket only
        this.socket = io(serverUrl, {
            transports: ['websocket'],
            upgrade: false
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            if (this.onConnectionChange) this.onConnectionChange(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.roomCode = null;
            if (this.onConnectionChange) this.onConnectionChange(false);
        });


        this.socket.on('roomCreated', (data) => {
            this.roomCode = data.code;
            this.isHost = true;
            if (this.onRoomCreated) this.onRoomCreated(data.code);
        });

        this.socket.on('joinedRoom', (data) => {
            this.roomCode = data.code;
            this.isHost = data.isHost;
            if (this.onJoinedRoom) this.onJoinedRoom(data);
        });

        this.socket.on('joinError', (data) => {
            if (this.onJoinError) this.onJoinError(data.message);
        });

        this.socket.on('guestJoined', (data) => {
            if (this.onGuestJoined) this.onGuestJoined(data);
        });

        this.socket.on('guestLeft', () => {
            this.opponentCharacter = null;
            this.opponentReady = false;
            if (this.onGuestLeft) this.onGuestLeft();
        });

        this.socket.on('roomClosed', (data) => {
            this.roomCode = null;
            this.isHost = false;
            if (this.onRoomClosed) this.onRoomClosed(data.reason);
        });

        this.socket.on('goToCharacterSelect', () => {
            if (this.onGoToCharacterSelect) this.onGoToCharacterSelect();
        });


        this.socket.on('opponentSelectedCharacter', (data) => {
            this.opponentCharacter = data.character;
            if (this.onOpponentSelectedCharacter) this.onOpponentSelectedCharacter(data.character);
        });

        this.socket.on('arenaSelected', (data) => {
            if (this.onArenaSelected) this.onArenaSelected(data.arena);
        });

        this.socket.on('opponentReady', () => {
            this.opponentReady = true;
            if (this.onOpponentReady) this.onOpponentReady();
        });


        this.socket.on('startOnlineGame', (data) => {
            if (this.onStartGame) this.onStartGame(data);
        });

        this.socket.on('opponentInput', (data) => {
            if (this.onOpponentInput) this.onOpponentInput(data);
        });

        this.socket.on('opponentPosition', (data) => {
            if (this.onOpponentPosition) this.onOpponentPosition(data);
        });

        this.socket.on('gameStateUpdate', (data) => {
            if (this.onGameStateUpdate) this.onGameStateUpdate(data);
        });

        this.socket.on('roundEnded', (data) => {
            if (this.onRoundEnded) this.onRoundEnded(data);
        });

        this.socket.on('matchEnded', (data) => {
            if (this.onMatchEnded) this.onMatchEnded(data);
        });

        this.socket.on('rematchRequested', (data) => {
            if (this.onRematchRequested) this.onRematchRequested(data);
        });

        this.socket.on('rematchDeclined', () => {
            if (this.onRematchDeclined) this.onRematchDeclined();
        });

        this.socket.on('startRematch', () => {
            this.opponentReady = false;
            if (this.onStartRematch) this.onStartRematch();
        });

        this.socket.on('chatMessage', (data) => {
            if (this.onChatMessage) this.onChatMessage(data);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.roomCode = null;
            this.isHost = false;
        }
    }

    createRoom() {
        if (!this.isConnected) {
            this.connect();
            setTimeout(() => this.socket.emit('createRoom'), 500);
        } else {
            this.socket.emit('createRoom');
        }
    }

    joinRoom(code) {
        if (!this.isConnected) {
            this.connect();
            setTimeout(() => this.socket.emit('joinRoom', code), 500);
        } else {
            this.socket.emit('joinRoom', code);
        }
    }

    leaveRoom() {
        if (this.socket) {
            this.socket.emit('leaveRoom');
            this.roomCode = null;
            this.isHost = false;
            this.opponentCharacter = null;
            this.opponentReady = false;
        }
    }

    selectCharacter(character) {
        if (this.socket) {
            this.socket.emit('selectCharacter', { character });
        }
    }

    selectArena(arena) {
        if (this.socket && this.isHost) {
            this.socket.emit('selectArena', { arena });
        }
    }

    setReady() {
        if (this.socket) {
            this.socket.emit('playerReady');
        }
    }

    sendInput(inputData) {
        if (this.socket) {
            this.socket.emit('playerInput', inputData);
        }
    }

    sendPosition(posData) {
        if (this.socket) {
            this.socket.emit('playerPosition', posData);
        }
    }

    sendGameState(state) {
        if (this.socket && this.isHost) {
            this.socket.emit('gameStateSync', state);
        }
    }

    sendRoundEnd(data) {
        if (this.socket) {
            this.socket.emit('roundEnd', data);
        }
    }

    sendMatchEnd(data) {
        if (this.socket) {
            this.socket.emit('matchEnd', data);
        }
    }

    requestRematch() {
        if (this.socket) {
            this.socket.emit('requestRematch');
        }
    }

    acceptRematch() {
        if (this.socket) {
            this.socket.emit('acceptRematch');
        }
    }

    declineRematch() {
        if (this.socket) {
            this.socket.emit('declineRematch');
        }
    }

    sendChatMessage(message) {
        if (this.socket) {
            this.socket.emit('chatMessage', message);
        }
    }
}


const multiplayer = new MultiplayerClient();
