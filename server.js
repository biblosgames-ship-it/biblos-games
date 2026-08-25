import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = 4000;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Estructura de salas en memoria real del servidor local
const rooms = new Map();

// Cola de emparejamiento 1 contra 1 (Matchmaking en vivo)
const duelQueue = [];

// Catálogo de Bots Bíblicos para autocompletar salas calibrados en todos los rangos
const BIBLE_BOT_NAMES = [
  { name: 'Pedro', avatar: '/avatars/pedro.jpg', rating: 1100 },
  { name: 'María', avatar: '/avatars/maria.jpg', rating: 1250 },
  { name: 'Débora', avatar: '/avatars/debora.jpg', rating: 1550 },
  { name: 'Moisés', avatar: '/avatars/moises.jpg', rating: 1850 },
  { name: 'Ester', avatar: '/avatars/esther.jpg', rating: 2200 },
  { name: 'Daniel', avatar: '/avatars/daniel.jpg', rating: 2600 },
  { name: 'Elías', avatar: '/avatars/elias.jpg', rating: 2850 },
  { name: 'Salomón', avatar: '/avatars/salomon.jpg', rating: 3100 }
];

// Estructura de Sala Pública Activa "Todos vs Todos" (3 a 8 Jugadores)
let activeGroupLobby = null;
let groupLobbyInterval = null;

// Estructura de Salas de Amigos en la Red (Lobbies Activos para Amigos)
const friendLobbies = new Map();

function broadcastActiveFriendLobbies() {
  const list = [];
  friendLobbies.forEach((lobby) => {
    list.push({
      code: lobby.code,
      hostName: lobby.host.name,
      hostAvatar: lobby.host.avatar,
      hostCountry: lobby.host.country || 'DO',
      hostCountryFlag: lobby.host.countryFlag || '🇩🇴',
      hostFriendCode: lobby.host.friendCode,
      hostRating: lobby.host.rating || 1000,
      playerCount: lobby.players.length,
      maxPlayers: 8,
      players: lobby.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        countryFlag: p.countryFlag || '🇩🇴'
      }))
    });
  });
  io.emit('ACTIVE_FRIEND_LOBBIES_UPDATE', list);
}

function broadcastGroupLobby() {
  if (!activeGroupLobby) return;
  const data = {
    code: activeGroupLobby.code,
    timeRemaining: activeGroupLobby.timeRemaining,
    players: activeGroupLobby.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      country: p.country || 'DO',
      countryFlag: p.countryFlag || '🇩🇴',
      rating: p.rating || 1000
    }))
  };
  activeGroupLobby.sockets.forEach(sock => {
    sock.emit('GROUP_LOBBY_UPDATE', data);
  });
}

function startGroupMatch() {
  if (!activeGroupLobby) return;
  if (groupLobbyInterval) {
    clearInterval(groupLobbyInterval);
    groupLobbyInterval = null;
  }

  const lobby = activeGroupLobby;
  activeGroupLobby = null;

  // Si hay menos de 3 jugadores, completar con bots para que sea una partida de 3
  const finalPlayers = lobby.players.map((p, idx) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    avatar: p.avatar,
    country: p.country || 'DO',
    countryFlag: p.countryFlag || '🇩🇴',
    rating: p.rating || 1000,
    isHost: idx === 0,
    position: 0,
    score: 0,
    ready: true,
    isBot: false
  }));

  if (finalPlayers.length < 3) {
    const needed = 3 - finalPlayers.length;
    const usedAvatars = new Set(finalPlayers.map(p => p.avatar));
    const availableBots = BIBLE_BOT_NAMES.filter(b => !usedAvatars.has(b.avatar));
    for (let i = 0; i < needed; i++) {
      const bot = availableBots[i % availableBots.length] || BIBLE_BOT_NAMES[i % BIBLE_BOT_NAMES.length];
      finalPlayers.push({
        id: 'bot_group_' + (i + 1),
        userId: 'bot_group_' + (i + 1),
        name: `BiblosBot (${bot.name})`,
        avatar: bot.avatar,
        country: 'DO',
        countryFlag: '🇩🇴',
        rating: bot.rating,
        isHost: false,
        position: 0,
        score: 0,
        ready: true,
        isBot: true
      });
    }
  }

  const roomData = {
    code: lobby.code,
    isPrivate: false,
    status: 'LOBBY',
    players: finalPlayers,
    currentQuestionIndex: 0
  };

  rooms.set(lobby.code, roomData);

  lobby.sockets.forEach(sock => {
    sock.join(lobby.code);
    sock.emit('GROUP_MATCH_START', { room: roomData });
  });

  console.log(`[TODOS VS TODOS] ¡Partida iniciada en sala ${lobby.code} con ${finalPlayers.length} jugadores!`);
}

io.on('connection', (socket) => {
  console.log(`[SOCKET] Cliente conectado: ${socket.id}`);

  // 0. Matchmaking 1 vs 1 en Tiempo Real
  socket.on('START_MATCHMAKING', (playerData) => {
    const player = {
      id: socket.id,
      userId: playerData?.userId || playerData?.id || socket.id,
      name: playerData?.name || 'Jugador Bíblico',
      avatar: playerData?.avatar || '/avatars/david.jpg',
      country: playerData?.country || 'DO',
      countryFlag: playerData?.countryFlag || '🇩🇴',
      rating: playerData?.rating || 1000,
      socket
    };

    // Limpiar si ya estaba registrado en la cola
    const existingIdx = duelQueue.findIndex(p => p.id === socket.id);
    if (existingIdx !== -1) {
      duelQueue.splice(existingIdx, 1);
    }

    // Buscar oponentes reales en la cola priorizando cercanía de Nivel/Rating (Skill-Based Matchmaking)
    const availableOpponents = duelQueue.filter(p => p.id !== socket.id);
    let opponent = null;

    if (availableOpponents.length > 0) {
      // 1. Intentar emparejar con el rival más cercano en puntos de Rating (ELO)
      // Ordenamos por menor diferencia absoluta de rating (|rating1 - rating2|)
      availableOpponents.sort((a, b) => {
        const diffA = Math.abs((a.rating || 1000) - (player.rating || 1000));
        const diffB = Math.abs((b.rating || 1000) - (player.rating || 1000));
        return diffA - diffB;
      });

      opponent = availableOpponents[0];
    }

    if (opponent) {
      // Remover al oponente de la cola
      const oppIdx = duelQueue.indexOf(opponent);
      if (oppIdx !== -1) duelQueue.splice(oppIdx, 1);

      // Crear sala de duelo 1v1
      const roomCode = 'DUEL-' + Math.floor(1000 + Math.random() * 9000).toString();
      const player1 = {
        id: opponent.id,
        userId: opponent.userId,
        name: opponent.name,
        avatar: opponent.avatar,
        country: opponent.country || 'DO',
        countryFlag: opponent.countryFlag || '🇩🇴',
        rating: opponent.rating,
        isHost: true,
        position: 0,
        score: 0,
        ready: true
      };
      const player2 = {
        id: player.id,
        userId: player.userId,
        name: player.name,
        avatar: player.avatar,
        country: player.country || 'DO',
        countryFlag: player.countryFlag || '🇩🇴',
        rating: player.rating,
        isHost: false,
        position: 0,
        score: 0,
        ready: true
      };

      const roomData = {
        code: roomCode,
        isPrivate: false,
        status: 'LOBBY',
        players: [player1, player2],
        currentQuestionIndex: 0
      };

      rooms.set(roomCode, roomData);
      opponent.socket.join(roomCode);
      player.socket.join(roomCode);

      // Notificar a ambos jugadores simultáneamente con su respectivo rival
      opponent.socket.emit('MATCH_FOUND', {
        room: roomData,
        opponent: { name: player2.name, avatar: player2.avatar, country: player2.country, countryFlag: player2.countryFlag, rating: player2.rating }
      });
      player.socket.emit('MATCH_FOUND', {
        room: roomData,
        opponent: { name: player1.name, avatar: player1.avatar, country: player1.country, countryFlag: player1.countryFlag, rating: player1.rating }
      });

      console.log(`[MATCHMAKING] ¡Emparejamiento exitoso! ${player1.name} vs ${player2.name} en sala ${roomCode}`);
    } else {
      // Agregar a la cola de espera activa
      duelQueue.push(player);
      socket.emit('MATCHMAKING_SEARCHING', { queuePosition: duelQueue.length });
      console.log(`[MATCHMAKING] ${player.name} buscando oponente 1v1... Total en cola: ${duelQueue.length}`);
    }
  });

  socket.on('CANCEL_MATCHMAKING', () => {
    const idx = duelQueue.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      const removed = duelQueue.splice(idx, 1);
      console.log(`[MATCHMAKING] ${removed[0]?.name} canceló la búsqueda.`);
    }
  });

  // 0.1 Matchmaking Grupal: "Todos Vs Todos" (3 a 8 Jugadores con 60 segundos / 1 minuto)
  socket.on('START_GROUP_MATCHMAKING', (playerData) => {
    const player = {
      id: socket.id,
      userId: playerData?.userId || playerData?.id || socket.id,
      name: playerData?.name || 'Jugador Bíblico',
      avatar: playerData?.avatar || '/avatars/david.jpg',
      country: playerData?.country || 'DO',
      countryFlag: playerData?.countryFlag || '🇩🇴',
      rating: playerData?.rating || 1000,
      socket
    };

    // Si no hay lobby activo de Todos Vs Todos, creamos uno con cuenta regresiva de 60 segundos (1 minuto)
    if (!activeGroupLobby) {
      const roomCode = 'TODOS-' + Math.floor(1000 + Math.random() * 9000).toString();
      activeGroupLobby = {
        code: roomCode,
        timeRemaining: 60,
        players: [player],
        sockets: new Map([[socket.id, socket]])
      };

      console.log(`[TODOS VS TODOS] Nuevo lobby creado: ${roomCode} por ${player.name}. Cuenta de 1 minuto (60s) iniciada.`);

      groupLobbyInterval = setInterval(() => {
        if (!activeGroupLobby) {
          clearInterval(groupLobbyInterval);
          groupLobbyInterval = null;
          return;
        }

        activeGroupLobby.timeRemaining -= 1;
        broadcastGroupLobby();

        if (activeGroupLobby.timeRemaining <= 0 || activeGroupLobby.players.length >= 8) {
          startGroupMatch();
        }
      }, 1000);
    } else {
      // Agregar al jugador al lobby existente si aún no está
      if (!activeGroupLobby.sockets.has(socket.id)) {
        activeGroupLobby.players.push(player);
        activeGroupLobby.sockets.set(socket.id, socket);
        console.log(`[TODOS VS TODOS] ${player.name} se unió a ${activeGroupLobby.code}. Total jugadores: ${activeGroupLobby.players.length}/8`);
      }
    }

    broadcastGroupLobby();

    // Si ya alcanzó 8 jugadores, iniciar de inmediato
    if (activeGroupLobby && activeGroupLobby.players.length >= 8) {
      startGroupMatch();
    }
  });

  socket.on('CANCEL_GROUP_MATCHMAKING', () => {
    if (activeGroupLobby) {
      activeGroupLobby.sockets.delete(socket.id);
      const pIdx = activeGroupLobby.players.findIndex(p => p.id === socket.id);
      if (pIdx !== -1) {
        const removed = activeGroupLobby.players.splice(pIdx, 1);
        console.log(`[TODOS VS TODOS] ${removed[0]?.name} salió de la cola.`);
      }

      if (activeGroupLobby.players.length === 0) {
        if (groupLobbyInterval) {
          clearInterval(groupLobbyInterval);
          groupLobbyInterval = null;
        }
        activeGroupLobby = null;
        console.log(`[TODOS VS TODOS] Lobby cancelado por falta de jugadores.`);
      } else {
        broadcastGroupLobby();
      }
    }
  });

  // 0.2 Salas de Amigos en la Red (Notificaciones & Lobby en Vivo)
  socket.on('START_FRIENDS_LOBBY', (playerData) => {
    const hostPlayer = {
      id: socket.id,
      userId: playerData?.userId || playerData?.id || socket.id,
      name: playerData?.name || 'Jugador Bíblico',
      avatar: playerData?.avatar || '/avatars/david.jpg',
      country: playerData?.country || 'DO',
      countryFlag: playerData?.countryFlag || '🇩🇴',
      rating: playerData?.rating || 1000,
      friendCode: playerData?.friendCode || '',
      isHost: true,
      position: 0,
      score: 0,
      ready: true
    };

    const roomCode = 'AMIGOS-' + Math.floor(1000 + Math.random() * 9000).toString();
    const lobby = {
      code: roomCode,
      host: hostPlayer,
      players: [hostPlayer],
      sockets: new Map([[socket.id, socket]])
    };

    friendLobbies.set(roomCode, lobby);
    socket.join(roomCode);

    console.log(`[AMIGOS] ${hostPlayer.name} (${hostPlayer.friendCode}) inició sala para amigos: ${roomCode}`);

    // Emitir a todos los amigos conectados en la red la notificación de invitación
    socket.broadcast.emit('FRIEND_ROOM_INVITATION', {
      roomCode,
      hostName: hostPlayer.name,
      hostAvatar: hostPlayer.avatar,
      hostCountryFlag: hostPlayer.countryFlag,
      hostFriendCode: hostPlayer.friendCode,
      hostRating: hostPlayer.rating
    });

    // Enviar estado de la sala al anfitrión
    socket.emit('FRIENDS_LOBBY_UPDATE', {
      code: roomCode,
      players: lobby.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        country: p.country,
        countryFlag: p.countryFlag,
        rating: p.rating,
        isHost: p.isHost
      }))
    });

    broadcastActiveFriendLobbies();
  });

  socket.on('GET_ACTIVE_FRIEND_LOBBIES', () => {
    const list = [];
    friendLobbies.forEach((lobby) => {
      list.push({
        code: lobby.code,
        hostName: lobby.host.name,
        hostAvatar: lobby.host.avatar,
        hostCountry: lobby.host.country || 'DO',
        hostCountryFlag: lobby.host.countryFlag || '🇩🇴',
        hostFriendCode: lobby.host.friendCode,
        hostRating: lobby.host.rating || 1000,
        playerCount: lobby.players.length,
        maxPlayers: 8,
        players: lobby.players.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          countryFlag: p.countryFlag || '🇩🇴'
        }))
      });
    });
    socket.emit('ACTIVE_FRIEND_LOBBIES_UPDATE', list);
  });

  socket.on('JOIN_FRIENDS_LOBBY', ({ roomCode, playerData }) => {
    const cleanCode = roomCode?.trim().toUpperCase();
    const lobby = friendLobbies.get(cleanCode);

    if (!lobby) {
      socket.emit('JOIN_ERROR', 'La sala de amigos ya no está disponible o el anfitrión salió.');
      return;
    }

    if (lobby.players.length >= 8) {
      socket.emit('JOIN_ERROR', 'La sala de amigos ya alcanzó el cupo máximo (8 jugadores).');
      return;
    }

    const friendPlayer = {
      id: socket.id,
      userId: playerData?.userId || playerData?.id || socket.id,
      name: playerData?.name || 'Amigo Bíblico',
      avatar: playerData?.avatar || '/avatars/david.jpg',
      country: playerData?.country || 'DO',
      countryFlag: playerData?.countryFlag || '🇩🇴',
      rating: playerData?.rating || 1000,
      friendCode: playerData?.friendCode || '',
      isHost: false,
      position: 0,
      score: 0,
      ready: true
    };

    if (!lobby.sockets.has(socket.id)) {
      lobby.players.push(friendPlayer);
      lobby.sockets.set(socket.id, socket);
      socket.join(cleanCode);
      console.log(`[AMIGOS] ${friendPlayer.name} se unió a la sala de amigos ${cleanCode}. Total: ${lobby.players.length}/8`);
    }

    const updatePayload = {
      code: cleanCode,
      players: lobby.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        country: p.country,
        countryFlag: p.countryFlag,
        rating: p.rating,
        isHost: p.isHost
      }))
    };

    lobby.sockets.forEach(s => {
      s.emit('FRIENDS_LOBBY_UPDATE', updatePayload);
    });

    broadcastActiveFriendLobbies();
  });

  socket.on('HOST_START_FRIENDS_MATCH', ({ roomCode }) => {
    const cleanCode = roomCode?.trim().toUpperCase();
    const lobby = friendLobbies.get(cleanCode);
    if (!lobby) return;

    friendLobbies.delete(cleanCode);
    broadcastActiveFriendLobbies();

    const finalPlayers = lobby.players.map(p => ({
      id: p.id,
      userId: p.userId || p.id,
      name: p.name,
      avatar: p.avatar,
      country: p.country || 'DO',
      countryFlag: p.countryFlag || '🇩🇴',
      rating: p.rating || 1000,
      isHost: p.isHost,
      position: 0,
      score: 0,
      ready: true
    }));

    const roomData = {
      code: cleanCode,
      isPrivate: true,
      status: 'LOBBY',
      players: finalPlayers,
      currentQuestionIndex: 0
    };

    rooms.set(cleanCode, roomData);

    console.log(`[AMIGOS] ¡Anfitrión inició partida en sala ${cleanCode} con ${finalPlayers.length} amigos!`);

    lobby.sockets.forEach(s => {
      s.emit('FRIENDS_MATCH_START', { room: roomData });
    });
  });

  socket.on('CANCEL_FRIENDS_LOBBY', ({ roomCode }) => {
    const cleanCode = roomCode?.trim().toUpperCase();
    const lobby = friendLobbies.get(cleanCode);
    if (lobby) {
      lobby.sockets.forEach(s => {
        if (s.id !== socket.id) {
          s.emit('FRIENDS_LOBBY_CANCELLED', { message: 'El anfitrión ha cerrado la sala de amigos.' });
        }
      });
      friendLobbies.delete(cleanCode);
      broadcastActiveFriendLobbies();
      console.log(`[AMIGOS] Sala de amigos ${cleanCode} cerrada por el anfitrión.`);
    }
  });

  // 1. Crear Sala Privada o Pública
  socket.on('CREATE_ROOM', ({ isPrivate, player }) => {
    const code = isPrivate 
      ? Math.floor(100000 + Math.random() * 900000).toString() 
      : 'PUB-' + Math.floor(1000 + Math.random() * 9000).toString();

    const hostPlayer = {
      id: socket.id,
      userId: player?.userId || player?.id || socket.id,
      name: player?.name || 'Anfitrión',
      avatar: player?.avatar || '/avatars/david.jpg',
      isHost: true,
      position: 0,
      score: 0,
      ready: true
    };

    const roomData = {
      code,
      isPrivate,
      status: 'LOBBY',
      players: [hostPlayer],
      currentQuestionIndex: 0
    };

    rooms.set(code, roomData);
    socket.join(code);
    socket.emit('ROOM_UPDATED', roomData);
    console.log(`[SOCKET] Sala creada: ${code} por ${hostPlayer.name}`);
  });

  // 2. Unirse a Sala existente mediante Código PIN
  socket.on('JOIN_ROOM', ({ code, player }) => {
    const cleanCode = code.trim().toUpperCase();
    const roomData = rooms.get(cleanCode);

    if (!roomData) {
      socket.emit('JOIN_ERROR', 'La sala no existe. Revisa el código PIN.');
      return;
    }

    const pUserId = player?.userId || player?.id || socket.id;
    const pName = player?.name || 'Competidor';

    const existingPlayer = roomData.players.find(p => p.userId === pUserId || p.name === pName);
    if (existingPlayer) {
      existingPlayer.id = socket.id;
    } else {
      const guestPlayer = {
        id: socket.id,
        userId: pUserId,
        name: pName,
        avatar: player?.avatar || '/avatars/esther.jpg',
        isHost: false,
        position: 0,
        score: 0,
        ready: true
      };
      roomData.players.push(guestPlayer);
    }

    socket.join(cleanCode);
    io.to(cleanCode).emit('ROOM_UPDATED', roomData);
    console.log(`[SOCKET] ${pName} se unió a la sala: ${cleanCode}`);
  });

  // 3. Cambiar estado de sala (Votación, Cuenta Regresiva, Juego)
  socket.on('SET_ROOM_STATUS', ({ code, status, extraData }) => {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    const roomData = rooms.get(cleanCode);
    if (roomData) {
      roomData.status = status;
      if (extraData) {
        Object.assign(roomData, extraData);
      }
      io.to(cleanCode).emit('ROOM_UPDATED', roomData);
      console.log(`[SOCKET] Sala ${cleanCode} cambio a estado: ${status}`);
    }
  });

  // 4. Sincronizar acciones de juego en tiempo real (Tablero, Dados, Turnos, Preguntas)
  socket.on('SYNC_GAME_ACTION', ({ code, action, payload }) => {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    const roomData = rooms.get(cleanCode);
    if (roomData) {
      // Persistir las posiciones y sanciones de los jugadores en el servidor
      if (action === 'ROLL_DICE' && payload?.playerIndex !== undefined) {
        if (roomData.players[payload.playerIndex]) {
          roomData.players[payload.playerIndex].position = payload.newPos;
          if (payload.skipNextTurn) {
            roomData.players[payload.playerIndex].skipNextTurn = true;
          }
        }
        if (payload.skippedPlayerIdx !== undefined && payload.skippedPlayerIdx !== null) {
          if (roomData.players[payload.skippedPlayerIdx]) {
            roomData.players[payload.skippedPlayerIdx].skipNextTurn = false;
          }
        }
      } else if (action === 'ANSWER_QUESTION' && payload?.playerIndex !== undefined) {
        if (roomData.players[payload.playerIndex] && payload?.newFinalPos !== undefined) {
          roomData.players[payload.playerIndex].position = payload.newFinalPos;
        }
        if (payload.skippedPlayerIdx !== undefined && payload.skippedPlayerIdx !== null) {
          if (roomData.players[payload.skippedPlayerIdx]) {
            roomData.players[payload.skippedPlayerIdx].skipNextTurn = false;
          }
        }
      } else if (action === 'PASS_SANCTION' && payload?.clearedPlayerIdx !== undefined) {
        if (roomData.players[payload.clearedPlayerIdx]) {
          roomData.players[payload.clearedPlayerIdx].skipNextTurn = false;
        }
      } else if (action === 'ADD_BOT_TO_ROOM') {
        if (roomData.players.length === 1) {
          const botIdx = Math.floor(Math.random() * BIBLE_BOT_NAMES.length);
          const botInfo = BIBLE_BOT_NAMES[botIdx];
          const botPlayer = {
            id: 'bot_' + Date.now(),
            userId: 'bot_' + Date.now(),
            name: `${botInfo.name} (Bot)`,
            avatar: botInfo.avatar,
            country: 'DO',
            countryFlag: '🇩🇴',
            rating: botInfo.rating,
            isHost: false,
            position: 0,
            score: 0,
            ready: true,
            isBot: true
          };
          roomData.players.push(botPlayer);
          io.to(cleanCode).emit('ROOM_UPDATED', roomData);
          console.log(`[BOT] Bot ${botPlayer.name} agregado a la sala ${cleanCode}`);
        }
      } else if (action === 'RESTART_GAME') {
        roomData.players.forEach(p => { p.position = 0; p.skipNextTurn = false; });
      }

      io.to(cleanCode).emit('GAME_ACTION_RECEIVED', { action, payload, senderId: socket.id });
      console.log(`[SOCKET] Accion ${action} en sala ${cleanCode}`);
    }
  });

  // 5. Chat en Vivo & Reacciones de Emojis Bíblicos
  const handleRoomChat = ({ roomCode, message }) => {
    const cleanCode = roomCode ? roomCode.trim().toUpperCase() : '';
    const chatData = {
      id: message?.id || ('msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      senderId: socket.id,
      senderName: message?.senderName || 'Hermano Bíblico',
      senderAvatar: message?.senderAvatar || '/avatars/david.jpg',
      text: message?.text || '',
      type: message?.type || 'QUICK_PHRASE',
      timestamp: message?.timestamp || Date.now()
    };
    io.to(cleanCode).emit('ROOM_CHAT_RECEIVED', chatData);
    console.log(`[CHAT] Mensaje en sala ${cleanCode} (${chatData.type}) de ${chatData.senderName}: ${chatData.text}`);
  };

  socket.on('SEND_ROOM_CHAT', handleRoomChat);
  socket.on('ROOM_CHAT_MESSAGE', handleRoomChat);

  // 6. Canal de Voz en Vivo (WebRTC Signaling & Estado de Micrófono)
  socket.on('VOICE_SIGNAL', ({ roomCode, targetId, signalData }) => {
    const cleanCode = roomCode ? roomCode.trim().toUpperCase() : '';
    if (targetId) {
      io.to(targetId).emit('VOICE_SIGNAL_RECEIVED', {
        senderId: socket.id,
        signalData
      });
    } else {
      socket.to(cleanCode).emit('VOICE_SIGNAL_RECEIVED', {
        senderId: socket.id,
        signalData
      });
    }
  });

  socket.on('VOICE_USER_SPEAKING', ({ roomCode, isSpeaking, userName }) => {
    const cleanCode = roomCode ? roomCode.trim().toUpperCase() : '';
    socket.to(cleanCode).emit('USER_SPEAKING_STATUS', {
      userId: socket.id,
      userName,
      isSpeaking
    });
  });

  // 7. Salir voluntariamente de la sala (Abandono voluntario / Forfeit)
  socket.on('LEAVE_ROOM', ({ code }) => {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    const roomData = rooms.get(cleanCode);
    if (roomData) {
      const leavingPlayer = roomData.players.find(p => p.id === socket.id);
      
      // Si la partida está en curso, es un abandono voluntario explícito
      if (roomData.status === 'PLAYING' && leavingPlayer) {
        console.log(`[ABANDONO VOLUNTARIO] ${leavingPlayer.name} se rindió y abandonó la partida en ${cleanCode}`);
        
        // Notificar al rival la victoria por abandono voluntario
        socket.to(cleanCode).emit('OPPONENT_ABANDONED', {
          leaverName: leavingPlayer.name,
          leaverAvatar: leavingPlayer.avatar,
          isVoluntary: true,
          message: `${leavingPlayer.name} ha abandonado la partida voluntariamente. ¡Victoria por abandono!`
        });

        // Enviar sanción al que abandonó
        socket.emit('SANCTION_APPLIED', {
          isVoluntary: true,
          reason: 'Abandono voluntario de partida en curso'
        });
      }

      roomData.players = roomData.players.filter(p => p.id !== socket.id);
      if (roomData.players.length === 0) {
        rooms.delete(cleanCode);
        console.log(`[SOCKET] Sala ${cleanCode} eliminada (vacia)`);
      } else {
        if (!roomData.players.some(p => p.isHost)) {
          roomData.players[0].isHost = true;
        }
        io.to(cleanCode).emit('ROOM_UPDATED', roomData);
      }
      socket.leave(cleanCode);
    }
  });

  // 8. Reconexión a partida activa tras desconexión involuntaria
  socket.on('RECONNECT_TO_MATCH', ({ code, userId, playerName }) => {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    const roomData = rooms.get(cleanCode);

    if (roomData && roomData.status === 'PLAYING') {
      const disconnectedPlayer = roomData.players.find(p => p.userId === userId || p.name === playerName);
      if (disconnectedPlayer) {
        disconnectedPlayer.id = socket.id;
        disconnectedPlayer.isDisconnected = false;
        if (disconnectedPlayer.reconnectTimer) {
          clearTimeout(disconnectedPlayer.reconnectTimer);
          disconnectedPlayer.reconnectTimer = null;
        }

        socket.join(cleanCode);
        io.to(cleanCode).emit('PLAYER_RECONNECTED', {
          playerName: disconnectedPlayer.name,
          room: roomData
        });
        socket.emit('RECONNECT_SUCCESS', roomData);
        console.log(`[RECONEXIÓN] ¡${disconnectedPlayer.name} se ha reconectado a tiempo en la sala ${cleanCode}!`);
        return;
      }
    }
    socket.emit('RECONNECT_FAILED', 'La partida ya concluyó o no está disponible.');
  });

  // 6. Desconexión de socket (Desconexión de red / caída temporal)
  socket.on('disconnect', () => {
    console.log(`[SOCKET] Cliente desconectado: ${socket.id}`);
    const qIdx = duelQueue.findIndex(p => p.id === socket.id);
    if (qIdx !== -1) {
      duelQueue.splice(qIdx, 1);
      console.log(`[MATCHMAKING] Cliente removido de la cola por desconexión.`);
    }

    for (const [code, roomData] of rooms.entries()) {
      const idx = roomData.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        const dcPlayer = roomData.players[idx];

        // Si la sala está en juego, otorgar 45 segundos de reconexión real
        if (roomData.status === 'PLAYING') {
          dcPlayer.isDisconnected = true;
          console.log(`[DESCONEXIÓN REAL] Jugador ${dcPlayer.name} perdió conexión. Otorgando 45s de gracia para reconectarse en sala ${code}`);

          // Notificar al rival que su oponente perdió conexión y está en ventana de gracia
          socket.to(code).emit('OPPONENT_DISCONNECTED_GRACE_PERIOD', {
            playerName: dcPlayer.name,
            gracePeriodSeconds: 45,
            message: `${dcPlayer.name} se ha desconectado. Esperando reconexión (45s)...`
          });

          dcPlayer.reconnectTimer = setTimeout(() => {
            const currentRoom = rooms.get(code);
            if (currentRoom) {
              const stillIdx = currentRoom.players.findIndex(p => p.userId === dcPlayer.userId && p.isDisconnected);
              if (stillIdx !== -1) {
                console.log(`[TIMEOUT DE RECONEXIÓN] ${dcPlayer.name} no regresó tras 45s en sala ${code}. Otorgando victoria a rival.`);
                
                // Notificar al oponente la victoria por tiempo de reconexión agotado
                io.to(code).emit('OPPONENT_ABANDONED', {
                  leaverName: dcPlayer.name,
                  leaverAvatar: dcPlayer.avatar,
                  isVoluntary: false,
                  message: `${dcPlayer.name} no se reconectó a tiempo. ¡Victoria por desconexión!`
                });

                currentRoom.players.splice(stillIdx, 1);
                if (currentRoom.players.length === 0) {
                  rooms.delete(code);
                } else {
                  io.to(code).emit('ROOM_UPDATED', currentRoom);
                }
              }
            }
          }, 45000);
        } else {
          roomData.players.splice(idx, 1);
          if (roomData.players.length === 0) {
            rooms.delete(code);
            console.log(`[SOCKET] Sala ${code} cerrada tras desconexion`);
          } else {
            if (!roomData.players.some(p => p.isHost)) {
              roomData.players[0].isHost = true;
            }
            io.to(code).emit('ROOM_UPDATED', roomData);
          }
        }
        break;
      }
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVIDORES MULTIJUGADOR] Servidor Local Socket.io activo en puerto ${PORT}`);
});
