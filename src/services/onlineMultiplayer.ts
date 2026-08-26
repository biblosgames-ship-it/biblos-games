import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { voiceChatService, RoomChatMessage } from './voiceChatService';

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

const BIBLE_BOTS = [
  { name: 'Pedro', avatar: '/avatars/pedro.jpg', rating: 1100, country: 'DO', countryFlag: '🇩🇴' },
  { name: 'María', avatar: '/avatars/maria.jpg', rating: 1250, country: 'PR', countryFlag: '🇵🇷' },
  { name: 'Débora', avatar: '/avatars/debora.jpg', rating: 1550, country: 'CO', countryFlag: '🇨🇴' },
  { name: 'Moisés', avatar: '/avatars/moises.jpg', rating: 1850, country: 'MX', countryFlag: '🇲🇽' },
  { name: 'Ester', avatar: '/avatars/esther.jpg', rating: 2200, country: 'GT', countryFlag: '🇬🇹' },
  { name: 'Daniel', avatar: '/avatars/daniel.jpg', rating: 2600, country: 'US', countryFlag: '🇺🇸' },
  { name: 'Elías', avatar: '/avatars/elias.jpg', rating: 2850, country: 'ES', countryFlag: '🇪🇸' },
  { name: 'Salomón', avatar: '/avatars/salomon.jpg', rating: 3100, country: 'PA', countryFlag: '🇵🇦' }
];

class OnlineMultiplayerService {
  private clientId: string;
  private currentRoom: OnlineRoom | null = null;
  private roomChannel: RealtimeChannel | null = null;
  private matchmakingChannel: RealtimeChannel | null = null;
  private groupLobbyChannel: RealtimeChannel | null = null;
  private friendsLobbyChannel: RealtimeChannel | null = null;

  private listeners: Array<(room: OnlineRoom) => void> = [];
  private actionListeners: Array<(data: { action: string; payload: any; senderId: string }) => void> = [];
  private matchmakingTimer: any = null;
  private groupLobbyTimer: any = null;

  // Listeners para invitaciones y lobbies
  private friendInviteCallbacks: Array<(invite: any) => void> = [];
  private activeFriendLobbiesCallbacks: Array<(lobbies: ActiveFriendLobby[]) => void> = [];
  private gracePeriodCallbacks: Array<(data: any) => void> = [];
  private playerReconnectedCallbacks: Array<(data: any) => void> = [];
  private opponentAbandonedCallbacks: Array<(data: any) => void> = [];
  private sanctionAppliedCallbacks: Array<(data: any) => void> = [];

  constructor() {
    // Generar o recuperar ID de cliente único persistente para la sesión
    let storedId = '';
    try {
      storedId = sessionStorage.getItem('biblos_client_id') || '';
      if (!storedId) {
        storedId = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('biblos_client_id', storedId);
      }
    } catch {
      storedId = 'usr_' + Math.random().toString(36).substring(2, 9);
    }
    this.clientId = storedId;

    // Conectar el servicio de chat con el canal activo
    voiceChatService.setSendHandler((roomCode, message) => {
      this.sendRoomChat(roomCode, message);
    });

    console.log(`[SUPABASE REALTIME] Multijugador inicializado con Client ID: ${this.clientId}`);
  }

  getSocket(): any {
    return {
      id: this.clientId,
      connected: true,
      emit: (event: string, data: any) => {
        if (event === 'SET_ROOM_STATUS' && data) {
          this.setRoomStatus(data.status, data.extraData);
        } else if (event === 'SYNC_GAME_ACTION' && data) {
          this.sendGameAction(data.action, data.payload);
        }
      },
      on: (_event: string, _cb: any) => {},
      off: (_event: string, _cb?: any) => {}
    };
  }

  getSocketId(): string {
    return this.clientId;
  }

  // --- GESTIÓN DE CANALES DE SALA ---
  private bindRoomChannel(code: string) {
    if (this.roomChannel) {
      supabase.removeChannel(this.roomChannel);
      this.roomChannel = null;
    }

    const channel = supabase.channel(`biblos_room_${code}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'ROOM_UPDATED' }, ({ payload }) => {
        if (payload && payload.code === code) {
          this.currentRoom = payload;
          this.notifyListeners();
        }
      })
      .on('broadcast', { event: 'GAME_ACTION' }, ({ payload }) => {
        if (payload) {
          this.actionListeners.forEach(listener => listener(payload));
        }
      })
      .on('broadcast', { event: 'ROOM_CHAT' }, ({ payload }) => {
        if (payload) {
          voiceChatService.receiveMessage(payload);
        }
      })
      .on('broadcast', { event: 'PLAYER_JOIN_REQUEST' }, ({ payload }) => {
        // Si soy el anfitrión, agrego al jugador y transmito la sala actualizada
        if (this.currentRoom && this.currentRoom.players.some(p => p.id === this.clientId && p.isHost)) {
          const joiningPlayer = payload.player as OnlinePlayer;
          if (joiningPlayer && !this.currentRoom.players.some(p => p.id === joiningPlayer.id)) {
            this.currentRoom.players.push(joiningPlayer);
            this.notifyListeners();
            this.broadcastRoomUpdate(this.currentRoom);
          }
        }
      })
      .on('broadcast', { event: 'PLAYER_LEAVE' }, ({ payload }) => {
        if (this.currentRoom && payload.playerId) {
          this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== payload.playerId);
          if (this.currentRoom.players.length > 0 && !this.currentRoom.players.some(p => p.isHost)) {
            this.currentRoom.players[0].isHost = true;
          }
          this.notifyListeners();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[SUPABASE REALTIME] Conectado a la sala: ${code}`);
        }
      });

    this.roomChannel = channel;
  }

  private broadcastRoomUpdate(room: OnlineRoom) {
    if (this.roomChannel) {
      this.roomChannel.send({
        type: 'broadcast',
        event: 'ROOM_UPDATED',
        payload: room
      });
    }
  }

  sendRoomChat(_roomCode: string, message: RoomChatMessage) {
    if (this.roomChannel) {
      this.roomChannel.send({
        type: 'broadcast',
        event: 'ROOM_CHAT',
        payload: message
      });
    }
    voiceChatService.receiveMessage(message);
  }

  // --- 0. MATCHMAKING 1 vs 1 ---
  startMatchmaking(
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number },
    onMatchFound: (data: { room: OnlineRoom; opponent: { name: string; avatar: string; country?: string; countryFlag?: string; rating: number } }) => void
  ) {
    this.cancelMatchmaking();

    const channelName = 'biblos_mm_1v1_global';
    const channel = supabase.channel(channelName, {
      config: { presence: { key: this.clientId } }
    });

    let matched = false;

    channel
      .on('broadcast', { event: 'MATCH_INVITE' }, ({ payload }) => {
        if (!matched && payload && payload.targetId === this.clientId) {
          matched = true;
          this.cancelMatchmaking();
          this.currentRoom = payload.room;
          this.bindRoomChannel(payload.room.code);
          this.notifyListeners();
          onMatchFound({ room: payload.room, opponent: payload.opponent });
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (matched) return;
        const state = channel.presenceState();
        const waitingPlayers: any[] = [];

        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.id && p.id !== this.clientId) {
              waitingPlayers.push(p);
            }
          });
        });

        if (waitingPlayers.length > 0) {
          // Elegir al primer rival disponible
          const opponent = waitingPlayers[0];
          
          // Determinista: el cliente con ID alfabéticamente menor actúa como creador de la sala
          if (this.clientId < opponent.id) {
            matched = true;
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const hostPlayer: OnlinePlayer = {
              id: this.clientId,
              name: player.name || 'Jugador 1',
              avatar: player.avatar || '/avatars/david.jpg',
              country: player.country || 'DO',
              countryFlag: player.countryFlag || '🇩🇴',
              isHost: true,
              position: 0,
              score: 0,
              ready: false
            };
            const guestPlayer: OnlinePlayer = {
              id: opponent.id,
              name: opponent.name || 'Rival',
              avatar: opponent.avatar || '/avatars/pedro.jpg',
              country: opponent.country || 'DO',
              countryFlag: opponent.countryFlag || '🇩🇴',
              isHost: false,
              position: 0,
              score: 0,
              ready: false
            };

            const room: OnlineRoom = {
              code,
              isPrivate: false,
              status: 'LOBBY',
              players: [hostPlayer, guestPlayer],
              currentQuestionIndex: 0
            };

            // Enviar invitación al rival
            channel.send({
              type: 'broadcast',
              event: 'MATCH_INVITE',
              payload: {
                targetId: opponent.id,
                room,
                opponent: {
                  name: player.name,
                  avatar: player.avatar,
                  country: player.country,
                  countryFlag: player.countryFlag,
                  rating: player.rating || 1000
                }
              }
            });

            this.cancelMatchmaking();
            this.currentRoom = room;
            this.bindRoomChannel(code);
            this.notifyListeners();
            onMatchFound({
              room,
              opponent: {
                name: opponent.name,
                avatar: opponent.avatar,
                country: opponent.country,
                countryFlag: opponent.countryFlag,
                rating: opponent.rating || 1000
              }
            });
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: this.clientId,
            name: player.name,
            avatar: player.avatar,
            country: player.country || 'DO',
            countryFlag: player.countryFlag || '🇩🇴',
            rating: player.rating || 1000,
            joinedAt: Date.now()
          });
        }
      });

    this.matchmakingChannel = channel;

    // Fallback con Bot Bíblico si no se encuentra rival humano en 7 segundos
    this.matchmakingTimer = setTimeout(() => {
      if (!matched) {
        matched = true;
        this.cancelMatchmaking();

        const botIdx = Math.floor(Math.random() * BIBLE_BOTS.length);
        const bot = BIBLE_BOTS[botIdx];
        const botId = 'bot_' + Math.random().toString(36).substring(2, 7);

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const room: OnlineRoom = {
          code,
          isPrivate: false,
          status: 'LOBBY',
          players: [
            {
              id: this.clientId,
              name: player.name || 'Jugador',
              avatar: player.avatar || '/avatars/david.jpg',
              country: player.country || 'DO',
              countryFlag: player.countryFlag || '🇩🇴',
              isHost: true,
              position: 0,
              score: 0,
              ready: false
            },
            {
              id: botId,
              name: bot.name,
              avatar: bot.avatar,
              country: bot.country,
              countryFlag: bot.countryFlag,
              isHost: false,
              position: 0,
              score: 0,
              ready: true,
              isBot: true
            }
          ],
          currentQuestionIndex: 0
        };

        this.currentRoom = room;
        this.bindRoomChannel(code);
        this.notifyListeners();
        onMatchFound({
          room,
          opponent: {
            name: bot.name,
            avatar: bot.avatar,
            country: bot.country,
            countryFlag: bot.countryFlag,
            rating: bot.rating
          }
        });
      }
    }, 7000);
  }

  cancelMatchmaking() {
    if (this.matchmakingTimer) {
      clearTimeout(this.matchmakingTimer);
      this.matchmakingTimer = null;
    }
    if (this.matchmakingChannel) {
      supabase.removeChannel(this.matchmakingChannel);
      this.matchmakingChannel = null;
    }
  }

  // --- 0.1 MATCHMAKING TODOS VS TODOS (3 a 8 Jugadores) ---
  startGroupMatchmaking(
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number },
    onLobbyUpdate: (data: { code: string; timeRemaining: number; players: OnlinePlayer[] }) => void,
    onMatchStart: (data: { room: OnlineRoom }) => void
  ) {
    this.cancelGroupMatchmaking();

    const channelName = 'biblos_group_lobby_global';
    const channel = supabase.channel(channelName, {
      config: { presence: { key: this.clientId } }
    });

    let timeRemaining = 20;
    const lobbyPlayers: OnlinePlayer[] = [
      {
        id: this.clientId,
        name: player.name || 'Jugador',
        avatar: player.avatar || '/avatars/david.jpg',
        country: player.country || 'DO',
        countryFlag: player.countryFlag || '🇩🇴',
        isHost: true,
        position: 0,
        score: 0,
        ready: true
      }
    ];

    onLobbyUpdate({ code: 'TODOS_VS_TODOS', timeRemaining, players: lobbyPlayers });

    this.groupLobbyTimer = setInterval(() => {
      timeRemaining--;
      if (timeRemaining > 0) {
        onLobbyUpdate({ code: 'TODOS_VS_TODOS', timeRemaining, players: lobbyPlayers });
      } else {
        this.cancelGroupMatchmaking();
        
        // Completar con bots si hay menos de 3 jugadores
        while (lobbyPlayers.length < 3) {
          const availableBot = BIBLE_BOTS[lobbyPlayers.length % BIBLE_BOTS.length];
          lobbyPlayers.push({
            id: 'bot_' + Math.random().toString(36).substring(2, 7),
            name: availableBot.name,
            avatar: availableBot.avatar,
            country: availableBot.country,
            countryFlag: availableBot.countryFlag,
            isHost: false,
            position: 0,
            score: 0,
            ready: true,
            isBot: true
          });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const room: OnlineRoom = {
          code,
          isPrivate: false,
          status: 'LOBBY',
          players: lobbyPlayers,
          currentQuestionIndex: 0
        };

        this.currentRoom = room;
        this.bindRoomChannel(code);
        this.notifyListeners();
        onMatchStart({ room });
      }
    }, 1000);

    this.groupLobbyChannel = channel;
  }

  cancelGroupMatchmaking() {
    if (this.groupLobbyTimer) {
      clearInterval(this.groupLobbyTimer);
      this.groupLobbyTimer = null;
    }
    if (this.groupLobbyChannel) {
      supabase.removeChannel(this.groupLobbyChannel);
      this.groupLobbyChannel = null;
    }
  }

  // --- 0.2 SALA DE AMIGOS EN VIVO ---
  startFriendsLobby(
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number; friendCode?: string },
    onLobbyUpdate: (data: { code: string; players: OnlinePlayer[] }) => void,
    onMatchStart: (data: { room: OnlineRoom }) => void
  ) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const host: OnlinePlayer = {
      id: this.clientId,
      name: player.name || 'Anfitrión',
      avatar: player.avatar || '/avatars/david.jpg',
      country: player.country || 'DO',
      countryFlag: player.countryFlag || '🇩🇴',
      isHost: true,
      position: 0,
      score: 0,
      ready: true
    };

    const room: OnlineRoom = {
      code,
      isPrivate: true,
      status: 'LOBBY',
      players: [host],
      currentQuestionIndex: 0
    };

    this.currentRoom = room;
    this.bindRoomChannel(code);
    this.notifyListeners();
    onLobbyUpdate({ code, players: [host] });

    // Cuando el host inicia la partida
    (this as any)._friendsOnStart = onMatchStart;
  }

  joinFriendsLobby(
    roomCode: string,
    player: { name: string; avatar: string; country?: string; countryFlag?: string; rating?: number; friendCode?: string },
    onLobbyUpdate: (data: { code: string; players: OnlinePlayer[] }) => void,
    onMatchStart: (data: { room: OnlineRoom }) => void
  ) {
    this.bindRoomChannel(roomCode);

    const guest: OnlinePlayer = {
      id: this.clientId,
      name: player.name || 'Invitado',
      avatar: player.avatar || '/avatars/esther.jpg',
      country: player.country || 'DO',
      countryFlag: player.countryFlag || '🇩🇴',
      isHost: false,
      position: 0,
      score: 0,
      ready: true
    };

    // Solicitar unirse al anfitrión
    setTimeout(() => {
      this.roomChannel?.send({
        type: 'broadcast',
        event: 'PLAYER_JOIN_REQUEST',
        payload: { player: guest }
      });
    }, 400);

    const unsub = this.subscribe((room) => {
      if (room.code === roomCode) {
        onLobbyUpdate({ code: roomCode, players: room.players });
        if (room.status !== 'LOBBY') {
          unsub();
          onMatchStart({ room });
        }
      }
    });
  }

  hostStartFriendsMatch(roomCode: string) {
    if (this.currentRoom && this.currentRoom.code === roomCode) {
      this.setRoomStatus('VOTING_THEME');
      if ((this as any)._friendsOnStart) {
        (this as any)._friendsOnStart({ room: this.currentRoom });
      }
    }
  }

  cancelFriendsLobby(roomCode: string) {
    this.leaveRoom();
  }

  onFriendRoomInvitation(callback: (invite: any) => void) {
    this.friendInviteCallbacks.push(callback);
    return () => {
      this.friendInviteCallbacks = this.friendInviteCallbacks.filter(cb => cb !== callback);
    };
  }

  requestActiveFriendLobbies() {
    this.activeFriendLobbiesCallbacks.forEach(cb => cb([]));
  }

  onActiveFriendLobbiesUpdate(callback: (lobbies: ActiveFriendLobby[]) => void) {
    this.activeFriendLobbiesCallbacks.push(callback);
    return () => {
      this.activeFriendLobbiesCallbacks = this.activeFriendLobbiesCallbacks.filter(cb => cb !== callback);
    };
  }

  // --- 1. CREAR SALA PRIVADA ---
  createRoom(isPrivate: boolean, hostPlayer: { name: string; avatar: string }): OnlineRoom | null {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const host: OnlinePlayer = {
      id: this.clientId,
      name: hostPlayer.name || 'Anfitrión',
      avatar: hostPlayer.avatar || '/avatars/david.jpg',
      isHost: true,
      position: 0,
      score: 0,
      ready: false
    };

    const room: OnlineRoom = {
      code,
      isPrivate,
      status: 'LOBBY',
      players: [host],
      currentQuestionIndex: 0
    };

    this.currentRoom = room;
    this.bindRoomChannel(code);
    this.notifyListeners();
    return room;
  }

  async createRoomAsync(isPrivate: boolean, hostPlayer: { name: string; avatar: string }): Promise<OnlineRoom> {
    const room = this.createRoom(isPrivate, hostPlayer);
    return room!;
  }

  // --- 2. UNIRSE A SALA MEDIANTE PIN ---
  joinRoom(code: string, player: { name: string; avatar: string }): OnlineRoom | null {
    const guest: OnlinePlayer = {
      id: this.clientId,
      name: player.name || 'Invitado',
      avatar: player.avatar || '/avatars/maria.jpg',
      isHost: false,
      position: 0,
      score: 0,
      ready: false
    };

    this.bindRoomChannel(code);

    setTimeout(() => {
      this.roomChannel?.send({
        type: 'broadcast',
        event: 'PLAYER_JOIN_REQUEST',
        payload: { player: guest }
      });
    }, 300);

    return this.currentRoom;
  }

  async joinRoomAsync(code: string, player: { name: string; avatar: string }): Promise<OnlineRoom | null> {
    return new Promise((resolve) => {
      this.joinRoom(code, player);

      let resolved = false;
      const unsub = this.subscribe((room) => {
        if (!resolved && room.code === code) {
          resolved = true;
          unsub();
          resolve(room);
        }
      });

      // Fallback a los 1800ms
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsub();
          if (!this.currentRoom) {
            this.currentRoom = {
              code,
              isPrivate: true,
              status: 'LOBBY',
              players: [{
                id: this.clientId,
                name: player.name,
                avatar: player.avatar,
                isHost: false,
                position: 0,
                score: 0,
                ready: true
              }],
              currentQuestionIndex: 0
            };
          }
          resolve(this.currentRoom);
        }
      }, 1800);
    });
  }

  // --- 3. ACCIONES Y ESTADOS DEL JUEGO ---
  setRoomStatus(status: OnlineRoom['status'], extraData?: Partial<OnlineRoom>) {
    if (!this.currentRoom) return;
    this.currentRoom.status = status;
    if (extraData) {
      Object.assign(this.currentRoom, extraData);
    }
    this.notifyListeners();
    this.broadcastRoomUpdate(this.currentRoom);
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
    if (!this.currentRoom || !this.roomChannel) return;

    const actionData = {
      action,
      payload,
      senderId: this.clientId
    };

    this.roomChannel.send({
      type: 'broadcast',
      event: 'GAME_ACTION',
      payload: actionData
    });
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
      this.notifyListeners();
      this.broadcastRoomUpdate(this.currentRoom);
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

  reconnectToMatch(code: string, _userId: string, _playerName: string): Promise<OnlineRoom | null> {
    return new Promise((resolve) => {
      this.bindRoomChannel(code);
      resolve(this.currentRoom);
    });
  }

  onOpponentGracePeriod(callback: (data: any) => void) {
    this.gracePeriodCallbacks.push(callback);
    return () => {
      this.gracePeriodCallbacks = this.gracePeriodCallbacks.filter(cb => cb !== callback);
    };
  }

  onPlayerReconnected(callback: (data: any) => void) {
    this.playerReconnectedCallbacks.push(callback);
    return () => {
      this.playerReconnectedCallbacks = this.playerReconnectedCallbacks.filter(cb => cb !== callback);
    };
  }

  onOpponentAbandoned(callback: (data: any) => void) {
    this.opponentAbandonedCallbacks.push(callback);
    return () => {
      this.opponentAbandonedCallbacks = this.opponentAbandonedCallbacks.filter(cb => cb !== callback);
    };
  }

  onSanctionApplied(callback: (data: any) => void) {
    this.sanctionAppliedCallbacks.push(callback);
    return () => {
      this.sanctionAppliedCallbacks = this.sanctionAppliedCallbacks.filter(cb => cb !== callback);
    };
  }

  leaveRoom() {
    if (this.roomChannel && this.currentRoom) {
      this.roomChannel.send({
        type: 'broadcast',
        event: 'PLAYER_LEAVE',
        payload: { playerId: this.clientId }
      });
      supabase.removeChannel(this.roomChannel);
      this.roomChannel = null;
    }
    this.currentRoom = null;
    this.notifyListeners();
  }
}

export const onlineService = new OnlineMultiplayerService();

