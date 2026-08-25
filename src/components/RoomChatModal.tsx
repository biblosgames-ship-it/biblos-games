import React, { useState, useEffect } from "react";
import { Smile, X, Sparkles, MessageSquare } from "lucide-react";
import { 
  voiceChatService, 
  RoomChatMessage, 
  BIBLICAL_QUICK_PHRASES, 
  BIBLICAL_EMOJIS 
} from "../services/voiceChatService";

interface RoomChatWidgetProps {
  roomCode: string;
  userName: string;
  userAvatar: string;
  playSound?: (type: string) => void;
  triggerHaptic?: (type: any) => void;
  onEmojiBurst?: (emoji: string, senderName: string) => void;
}

export const RoomChatWidget: React.FC<RoomChatWidgetProps> = ({
  roomCode,
  userName,
  userAvatar,
  playSound,
  triggerHaptic,
  onEmojiBurst
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"EMOJIS" | "PHRASES">("PHRASES");
  const [lastReaction, setLastReaction] = useState<string | null>(null);

  useEffect(() => {
    voiceChatService.setRoom(roomCode);

    const unsubChat = voiceChatService.subscribeChat((msg) => {
      if (playSound) playSound("select");

      if (onEmojiBurst) {
        onEmojiBurst(msg.text, msg.senderName);
      }
    });

    return () => {
      unsubChat();
    };
  }, [roomCode, playSound, onEmojiBurst]);

  const handleSendQuickPhrase = (phrase: string) => {
    voiceChatService.sendMessage(roomCode, userName, userAvatar, phrase, "QUICK_PHRASE");
    setLastReaction(phrase);
    if (playSound) playSound("correct");
    if (triggerHaptic) triggerHaptic("success");
    setTimeout(() => setLastReaction(null), 2500);
  };

  const handleSendEmoji = (emoji: string) => {
    voiceChatService.sendMessage(roomCode, userName, userAvatar, emoji, "EMOJI_REACTION");
    if (playSound) playSound("select");
    if (triggerHaptic) triggerHaptic("success");
  };

  return (
    <>
      {/* 🔘 BOTÓN FLOTANTE DE REACCIONES RÁPIDAS */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (playSound) playSound("select");
          }}
          title="Reacciones y Frases Rápidas"
          className="p-3 bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black rounded-full shadow-2xl transition-all active:scale-95 cursor-pointer border-2 border-amber-300 flex items-center justify-center relative group ring-4 ring-amber-500/20"
        >
          <Smile size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="sr-only">Reacciones</span>
        </button>
      </div>

      {/* 📜 MODAL / BANDEJA DE REACCIONES BÍBLICAS RÁPIDAS */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-[#24201A] border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in text-stone-200">
          {/* Cabecera */}
          <div className="p-3 bg-gradient-to-r from-amber-950 to-stone-900 border-b border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <div>
                <h4 className="font-serif font-black text-xs text-amber-200 uppercase tracking-wider">
                  Reacciones Rápidas
                </h4>
                <p className="text-[9px] text-stone-400">
                  Sala: <span className="font-mono text-amber-300">{roomCode}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-white rounded-full bg-stone-800/60 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Pestañas: Frases Rápidas vs Emojis */}
          <div className="grid grid-cols-2 p-1.5 bg-stone-950/80 gap-1 text-[11px] font-black uppercase tracking-wider">
            <button
              onClick={() => setActiveTab("PHRASES")}
              className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "PHRASES"
                  ? "bg-amber-500 text-stone-950 shadow"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
              }`}
            >
              <MessageSquare size={13} />
              <span>Frases</span>
            </button>

            <button
              onClick={() => setActiveTab("EMOJIS")}
              className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "EMOJIS"
                  ? "bg-amber-500 text-stone-950 shadow"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
              }`}
            >
              <Smile size={13} />
              <span>Emojis</span>
            </button>
          </div>

          {/* Feedback de última frase enviada */}
          {lastReaction && (
            <div className="mx-3 mt-2 py-1 px-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-center text-xs font-black text-emerald-300 animate-fade-in">
              <span>{lastReaction}</span>
            </div>
          )}

          {/* Contenido de Reacciones */}
          <div className="p-3 max-h-72 overflow-y-auto custom-scrollbar">
            {activeTab === "PHRASES" ? (
              <div className="grid grid-cols-1 gap-1.5">
                {BIBLICAL_QUICK_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuickPhrase(phrase)}
                    className="p-2.5 bg-stone-900/90 hover:bg-amber-950/70 border border-stone-800 hover:border-amber-500/60 rounded-xl text-left text-xs font-bold text-stone-200 hover:text-amber-200 transition active:scale-98 shadow flex items-center justify-between cursor-pointer"
                  >
                    <span>{phrase}</span>
                    <span className="text-[10px] text-stone-500 opacity-60">Enviar ⚡</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {BIBLICAL_EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendEmoji(emoji)}
                    className="h-12 bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-400 rounded-2xl text-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition shadow cursor-pointer"
                  >
                    <span>{emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
