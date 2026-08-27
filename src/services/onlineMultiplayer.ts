import { io, Socket } from 'socket.io-client';
import { voiceChatService } from './voiceChatService';

export interface OnlinePlayer {
  id: string;
  name: string;
  avatar: string;
  country?: string;
  countryFlag?: string;
  isHost: boolean;
  position: number;
  score: number;
  ready: boolean;
  isBot?: boolean;
  themeVote?: string;
  difficultyVote?: string;
}

export interface ActiveFriendLobby {
  code: string;
  hostName: string;
  hostAvatar: string;
  hostCountry?: string;
  hostCountryFlag?: string;
  hostFriendCode: string;
  hostRating: number;
  playerCount: number;
  maxPlayers: number;
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    countryFlag?: string;
  }>;
}

export interface OnlineRoom {
  code: string;
  isPrivate: boolean;
  status: 'LOBBY' | 'VOTING_THEME' | 'VOTING_DIFFICULTY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHED';
  players: OnlinePlayer[];
  winningTheme?: string;
  winningDifficulty?: string;
  currentQuestionIndex: number;
  startTime?: number;
}

class OnlineMultiplayerService {
  private socket: Socket;
  private currentRoom: OnlineRoom | null = null;
  private listeners: Array<(room: OnlineRoom) => void> = [];
  private actionListeners: Array<(data: { action: string; payload: any; senderId: string }) => void> = [];

  constructor() {
    // Detección inteligente de URL:
    // 1. Si está configurada la variable VITE_SOCKET_SERVER_URL, usarla
    // 2. Si estamos en la app nativa de Android/Capacitor o producción, conectar a Railway
    // 3. Si estamos en desarrollo local con Vite (puerto 3000 o 5173), conectar a localhost:4000
    const isLocalHost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const isViteDev = isLocalHost && (window.location.port === '3000' || window.location.port === '5173');
    
    let defaultUrl = 'https://biblos-games-production.up.railway.app';
    if (isViteDev) {
      defaultUrl = `http://${window.location.hostname}:4000`;
    } else if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      defaultUrl = window.location.origin;
    }

    const serverUrl = import.meta.env.VITE_SOCKET_SERVER_URL || defaultUrl;

    console.log(`[ONLINE SOCKET] Conectando a servidor: ${serverUrl}`);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log(`[ONLINE SOCKET] Conectado exitosamente (ID: ${this.socket.id})`);
    });

    this.socket.on('connect_error', (err) => {
      console.warn(`[ONLINE SOCKET] Error de conexión con ${serverUrl}:`, err.message);
    });

    // Escuchar actualizaciones de la sala en tiempo real desde el servidor
    this.socket.on('ROOM_UPDATED', (roomData: OnlineRoom) => {
      this.currentRoom = roomData;
      this.notifyListeners();
    });

    // Escuchar acciones del juego sincronizadas
    this.socket.on('GAME_ACTION_RECEIVED', (data: { action: string; payload: any; senderId: string }) => {
      this.actionListeners.forEach(listener => listener(data));
    });

    this.socket.on('JOIN_ERROR', (msg: string) => {
      alert(`⚠️ Error al unirse: ${msg}`);
    });

    voiceChatService.setSocket(this.socket);
  }

  getSocket(): Socket {
    return this.socket;
  }

  getSocketId(): string {
    return this.socket.id || '';
  }

  // 0. Matchmaking 1 vs 1 (Cola en tiempo real)
  startMatchmaking(
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number },
    onMatchFound: (data: { room: OnlineRoom; opponent: { name: string; avatar: string; country?: string; countryFlag?: string; rating: number } }) => void
  ) {
    this.socket.emit('START_MATCHMAKING', player);

    const onMatch = (data: { room: OnlineRoom; opponent: { name: string; avatar: string; country?: string; countryFlag?: string; rating: number } }) => {
      this.socket.off('MATCH_FOUND', onMatch);
      this.currentRoom = data.room;
      this.notifyListeners();
      onMatchFound(data);
    };

    this.socket.on('MATCH_FOUND', onMatch);
  }

  cancelMatchmaking() {
    this.socket.emit('CANCEL_MATCHMAKING');
    this.socket.off('MATCH_FOUND');
  }

  // 0.1 Matchmaking Grupal: "Todos Vs Todos" (3 a 8 Jugadores con 30 segundos)
  startGroupMatchmaking(
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number },
    onLobbyUpdate: (data: { code: string; timeRemaining: number; players: OnlinePlayer[] }) => void,
    onMatchStart: (data: { room: OnlineRoom }) => void
  ) {
    this.socket.emit('START_GROUP_MATCHMAKING', player);

    this.socket.off('GROUP_LOBBY_UPDATE');
    this.socket.on('GROUP_LOBBY_UPDATE', (data: { code: string; timeRemaining: number; players: OnlinePlayer[] }) => {
      onLobbyUpdate(data);
    });

    const onStart = (data: { room: OnlineRoom }) => {
      this.socket.off('GROUP_LOBBY_UPDATE');
      this.socket.off('GROUP_MATCH_START', onStart);
      this.currentRoom = data.room;
      this.notifyListeners();
      onMatchStart(data);
    };

    this.socket.on('GROUP_MATCH_START', onStart);
  }

  cancelGroupMatchmaking() {
    this.socket.emit('CANCEL_GROUP_MATCHMAKING');
    this.socket.off('GROUP_LOBBY_UPDATE');
    this.socket.off('GROUP_MATCH_START');
  }

  // 0.2 Sala de Amigos en Vivo (Red de Amigos)
  startFriendsLobby(
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number; friendCode?: string },
    onLobbyUpdate: (data: { code: string; players: OnlinePlayer[] }) => void,
    onMatchStart: (data: { room: OnlineRoom }) => void
  ) {
    this.socket.emit('START_FRIENDS_LOBBY', player);

    this.socket.off('FRIENDS_LOBBY_UPDATE');
    this.socket.on('FRIENDS_LOBBY_UPDATE', (data: { code: string; players: OnlinePlayer[] }) => {
      onLobbyUpdate(data);
    });

    const onStart = (data: { room: OnlineRoom }) => {
      this.socket.off('FRIENDS_LOBBY_UPDATE');
      this.socket.off('FRIENDS_MATCH_START', onStart);
      this.currentRoom = data.room;
      this.notifyListeners();
      onMatchStart(data);
    };

    this.socket.on('FRIENDS_MATCH_START', onStart);
  }

  joinFriendsLobby(
    roomCode: string,
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number; friendCode?: string },
    onLobbyUpdate: (data: { code: string; players: OnlinePlayer[] }) => void,
    onMatchStart: (data: { room: OnlineRoom }) => void
  ) {
    this.socket.emit('JOIN_FRIENDS_LOBBY', { roomCode, playerData: player });

    this.socket.off('FRIENDS_LOBBY_UPDATE');
    this.socket.on('FRIENDS_LOBBY_UPDATE', (data: { code: string; players: OnlinePlayer[] }) => {
      onLobbyUpdate(data);
    });

    const onStart = (data: { room: OnlineRoom }) => {
      this.socket.off('FRIENDS_LOBBY_UPDATE');
      this.socket.off('FRIENDS_MATCH_START', onStart);
      this.currentRoom = data.room;
      this.notifyListeners();
      onMatchStart(data);
    };

    this.socket.on('FRIENDS_MATCH_START', onStart);
  }

  hostStartFriendsMatch(roomCode: string) {
    this.socket.emit('HOST_START_FRIENDS_MATCH', { roomCode });
  }

  cancelFriendsLobby(roomCode: string) {
    this.socket.emit('CANCEL_FRIENDS_LOBBY', { roomCode });
    this.socket.off('FRIENDS_LOBBY_UPDATE');
    this.socket.off('FRIENDS_MATCH_START');
  }

  onFriendRoomInvitation(
    callback: (invite: { roomCode: string; hostName: string; hostAvatar: string; hostCountryFlag: string; hostFriendCode: string; hostRating: number }) => void
  ) {
    this.socket.on('FRIEND_ROOM_INVITATION', callback);
    return () => {
      this.socket.off('FRIEND_ROOM_INVITATION', callback);
    };
  }

  requestActiveFriendLobbies() {
    this.socket.emit('GET_ACTIVE_FRIEND_LOBBIES');
  }

  onActiveFriendLobbiesUpdate(callback: (lobbies: ActiveFriendLobby[]) => void) {
    this.socket.on('ACTIVE_FRIEND_LOBBIES_UPDATE', callback);
    this.socket.emit('GET_ACTIVE_FRIEND_LOBBIES');
    return () => {
      this.socket.off('ACTIVE_FRIEND_LOBBIES_UPDATE', callback);
    };
  }

  // 1. Crear Sala Privada o Pública
  createRoom(isPrivate: boolean, hostPlayer: { name: string; avatar: string }): OnlineRoom | null {
    this.socket.emit('CREATE_ROOM', { isPrivate, player: hostPlayer });
    return this.currentRoom;
  }

  async createRoomAsync(isPrivate: boolean, hostPlayer: { name: string; avatar: string }): Promise<OnlineRoom> {
    return new Promise((resolve) => {
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      const fallbackRoom: OnlineRoom = {
        code: fallbackCode,
        isPrivate,
        status: 'LOBBY',
        players: [{
          id: this.socket.id || 'host_1',
          name: hostPlayer.name || 'Anfitrión',
          avatar: hostPlayer.avatar || '/avatars/david.jpg',
          isHost: true,
          position: 0,
          score: 0,
          ready: false
        }],
        currentQuestionIndex: 0
      };

      let resolved = false;

      const onRoomUpdated = (roomData: OnlineRoom) => {
        if (!resolved) {
          resolved = true;
          this.socket.off('ROOM_UPDATED', onRoomUpdated);
          this.currentRoom = roomData;
          this.notifyListeners();
          resolve(roomData);
        }
      };

      this.socket.on('ROOM_UPDATED', onRoomUpdated);
      this.socket.emit('CREATE_ROOM', { isPrivate, player: hostPlayer });

      // Fallback a los 1500ms si el servidor no responde
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.socket.off('ROOM_UPDATED', onRoomUpdated);
          this.currentRoom = fallbackRoom;
          this.notifyListeners();
          resolve(fallbackRoom);
        }
      }, 1500);
    });
  }

  // 2. Unirse a Sala mediante PIN
  joinRoom(code: string, player: { name: string; avatar: string }): OnlineRoom | null {
    this.socket.emit('JOIN_ROOM', { code, player });
    return this.currentRoom;
  }

  async joinRoomAsync(code: string, player: { name: string; avatar: string }): Promise<OnlineRoom | null> {
    return new Promise((resolve) => {
      let resolved = false;

      const onRoomUpdated = (roomData: OnlineRoom) => {
        if (!resolved && roomData.code === code) {
          resolved = true;
          this.socket.off('ROOM_UPDATED', onRoomUpdated);
          this.currentRoom = roomData;
          this.notifyListeners();
          resolve(roomData);
        }
      };

      this.socket.on('ROOM_UPDATED', onRoomUpdated);
      this.socket.emit('JOIN_ROOM', { code, player });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.socket.off('ROOM_UPDATED', onRoomUpdated);
          resolve(this.currentRoom);
        }
      }, 2000);
    });
  }

  // 3. Cambiar estado de sala
  setRoomStatus(status: OnlineRoom['status'], extraData?: Partial<OnlineRoom>) {
    if (!this.currentRoom) return;
    this.socket.emit('SET_ROOM_STATUS', { code: this.currentRoom.code, status, extraData });
  }

  voteTheme(playerId: string, theme: string) {
    if (!this.currentRoom) return;
    this.setRoomStatus('VOTING_DIFFICULTY', { winningTheme: theme });
  }

  voteDifficulty(playerId: string, difficulty: string) {
    if (!this.currentRoom) return;
    this.setRoomStatus('COUNTDOWN', { winningDifficulty: difficulty });
  }

  sendGameAction(action: string, payload: any = {}) {
    if (!this.currentRoom) return;
    this.socket.emit('SYNC_GAME_ACTION', { code: this.currentRoom.code, action, payload });
  }

  subscribeGameAction(callback: (data: { action: string; payload: any; senderId: string }) => void) {
    this.actionListeners.push(callback);
    return () => {
      this.actionListeners = this.actionListeners.filter(l => l !== callback);
    };
  }

  updatePlayerPosition(playerId: string, newPos: number, pointsAdded: number = 0) {
    if (!this.currentRoom) return;
    const p = this.currentRoom.players.find(x => x.id === playerId);
    if (p) {
      p.position = Math.min(newPos, 75);
      p.score += pointsAdded;
      this.socket.emit('SET_ROOM_STATUS', { code: this.currentRoom.code, status: this.currentRoom.status, extraData: { players: this.currentRoom.players } });
    }
  }

  subscribe(callback: (room: OnlineRoom) => void) {
    this.listeners.push(callback);
    if (this.currentRoom) callback(this.currentRoom);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    if (this.currentRoom) {
      const copy = JSON.parse(JSON.stringify(this.currentRoom));
      this.listeners.forEach(listener => listener(copy));
    }
  }

  getRoom() {
    return this.currentRoom;
  }

  reconnectToMatch(code: string, userId: string, playerName: string): Promise<OnlineRoom | null> {
    return new Promise((resolve) => {
      this.socket.emit('RECONNECT_TO_MATCH', { code, userId, playerName });

      const onSuccess = (room: OnlineRoom) => {
        this.socket.off('RECONNECT_SUCCESS', onSuccess);
        this.socket.off('RECONNECT_FAILED', onFailed);
        this.currentRoom = room;
        this.notifyListeners();
        resolve(room);
      };

      const onFailed = () => {
        this.socket.off('RECONNECT_SUCCESS', onSuccess);
        this.socket.off('RECONNECT_FAILED', onFailed);
        resolve(null);
      };

      this.socket.on('RECONNECT_SUCCESS', onSuccess);
      this.socket.on('RECONNECT_FAILED', onFailed);
    });
  }

  onOpponentGracePeriod(callback: (data: { playerName: string; gracePeriodSeconds: number; message: string }) => void) {
    this.socket.on('OPPONENT_DISCONNECTED_GRACE_PERIOD', callback);
    return () => {
      this.socket.off('OPPONENT_DISCONNECTED_GRACE_PERIOD', callback);
    };
  }

  onPlayerReconnected(callback: (data: { playerName: string; room: OnlineRoom }) => void) {
    this.socket.on('PLAYER_RECONNECTED', callback);
    return () => {
      this.socket.off('PLAYER_RECONNECTED', callback);
    };
  }

  onOpponentAbandoned(callback: (data: { leaverName: string; leaverAvatar: string; isVoluntary: boolean; message: string }) => void) {
    this.socket.on('OPPONENT_ABANDONED', callback);
    return () => {
      this.socket.off('OPPONENT_ABANDONED', callback);
    };
  }

  onSanctionApplied(callback: (data: { isVoluntary: boolean; reason: string }) => void) {
    this.socket.on('SANCTION_APPLIED', callback);
    return () => {
      this.socket.off('SANCTION_APPLIED', callback);
    };
  }

  leaveRoom() {
    if (this.currentRoom) {
      this.socket.emit('LEAVE_ROOM', { code: this.currentRoom.code });
    }
    this.currentRoom = null;
    this.notifyListeners();
  }
}

export const onlineService = new OnlineMultiplayerService();


