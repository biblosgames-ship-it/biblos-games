import { io, Socket } from "socket.io-client";

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: "QUICK_PHRASE" | "EMOJI_REACTION";
  timestamp: number;
}

export const BIBLICAL_QUICK_PHRASES = [
  "👍 ¡Bien jugado!",
  "👏 ¡Excelente!",
  "🔥 ¡Qué partida!",
  "😂 ¡Casi!",
  "😮 ¡Qué respuesta!",
  "🕊️ ¡Gloria a Dios!",
  "📖 ¡Esa estuvo buena!",
  "🎲 ¡Te toca lanzar!",
  "⚡ ¡Que gane el mejor!",
  "🙏 ¡Buena partida!",
  "🎯 ¡Directo a la meta!",
  "✨ ¡Dios te bendiga!"
];

export const BIBLICAL_EMOJIS = [
  "👍", "👏", "🔥", "😂", "😮", "🕊️", "👑", "📖", "🙏", "⭐", "❤️", "⚡"
];

class VoiceChatService {
  private socket: Socket | null = null;
  private currentRoomCode: string | null = null;
  private chatListeners: Array<(msg: RoomChatMessage) => void> = [];

  constructor() {}

  setSocket(socketInstance: Socket) {
    this.socket = socketInstance;

    this.socket.off("ROOM_CHAT_RECEIVED");
    this.socket.on("ROOM_CHAT_RECEIVED", (msg: RoomChatMessage) => {
      this.chatListeners.forEach(cb => cb(msg));
    });
  }

  setRoom(roomCode: string) {
    this.currentRoomCode = roomCode;
  }

  subscribeChat(callback: (msg: RoomChatMessage) => void): () => void {
    this.chatListeners.push(callback);
    return () => {
      this.chatListeners = this.chatListeners.filter(cb => cb !== callback);
    };
  }

  sendMessage(
    roomCode: string,
    userName: string,
    userAvatar: string,
    text: string,
    type: "QUICK_PHRASE" | "EMOJI_REACTION" = "QUICK_PHRASE"
  ) {
    const message: RoomChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      senderId: this.socket?.id || "local_" + Math.random().toString(36).substring(2, 6),
      senderName: userName,
      senderAvatar: userAvatar,
      text,
      type,
      timestamp: Date.now()
    };

    if (this.socket && this.socket.connected) {
      this.socket.emit("SEND_ROOM_CHAT", { roomCode, message });
      this.socket.emit("ROOM_CHAT_MESSAGE", { roomCode, message });
    }
  }
}

export const voiceChatService = new VoiceChatService();
