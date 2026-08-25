import { supabase } from '../supabaseClient';
import { getOrCreateUserId } from './userProfile';

export type FriendStatus = "ACCEPTED" | "PENDING_INCOMING" | "PENDING_OUTGOING" | "BLOCKED";

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  code: string;
  country?: string;
  countryFlag?: string;
  rating?: number;
  isOnline?: boolean;
  lastPlayed?: string;
  status: FriendStatus;
  socialPlatform?: "whatsapp" | "facebook" | "telegram" | "twitter" | "link" | "code";
  isReported?: boolean;
  reportReason?: string;
}

export interface FriendReport {
  reportedFriendCode: string;
  reportedFriendName: string;
  reason: string;
  details?: string;
  timestamp: number;
}

const STORAGE_KEY = "biblos_friends_list";
const BLOCKED_STORAGE_KEY = "biblos_blocked_users";
const REPORTS_STORAGE_KEY = "biblos_user_reports";

export function getSavedFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: Friend[] = JSON.parse(raw);
    const cleaned = parsed
      .filter(f => !["f_1", "f_2", "f_3", "f_4"].includes(f.id))
      .map(f => ({
        ...f,
        status: f.status || "ACCEPTED"
      }));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveFriends(friends: Friend[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
  } catch (err) {
    console.error("Error saving friends:", err);
  }
}

export function getBlockedUsers(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isUserBlocked(codeOrId: string): boolean {
  const blocked = getBlockedUsers();
  return blocked.includes(codeOrId.toUpperCase());
}

export function addFriend(
  name: string,
  code: string,
  avatar: string = "/avatars/david.jpg",
  country: string = "DO",
  countryFlag: string = "🇩🇴",
  socialPlatform: "whatsapp" | "facebook" | "telegram" | "twitter" | "link" | "code" = "code",
  status: FriendStatus = "ACCEPTED"
): Friend {
  const current = getSavedFriends();
  const cleanCode = code.trim().toUpperCase();

  if (isUserBlocked(cleanCode)) {
    throw new Error("Este usuario se encuentra en tu lista de bloqueados.");
  }

  const existing = current.find(f => f.code === cleanCode);
  if (existing) {
    if (existing.status !== status) {
      existing.status = status;
      saveFriends(current);
    }
    return existing;
  }

  const newFriend: Friend = {
    id: `fr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim() || "Amigo Bíblico",
    avatar: avatar || "/avatars/david.jpg",
    code: cleanCode,
    country,
    countryFlag,
    rating: 1000 + Math.floor(Math.random() * 200),
    isOnline: true,
    lastPlayed: "Hoy",
    status,
    socialPlatform
  };

  const updated = [newFriend, ...current.filter(f => f.code !== newFriend.code)];
  saveFriends(updated);
  return newFriend;
}

export function acceptFriendRequest(idOrCode: string): Friend[] {
  const current = getSavedFriends();
  const updated = current.map(f => {
    if (f.id === idOrCode || f.code === idOrCode.toUpperCase()) {
      return { ...f, status: "ACCEPTED" as FriendStatus };
    }
    return f;
  });
  saveFriends(updated);
  return updated;
}

export function rejectFriendRequest(idOrCode: string): Friend[] {
  return removeFriend(idOrCode);
}

export function removeFriend(idOrCode: string): Friend[] {
  const current = getSavedFriends();
  const updated = current.filter(f => f.id !== idOrCode && f.code !== idOrCode.toUpperCase());
  saveFriends(updated);
  return updated;
}

export function blockUser(idOrCode: string, name?: string): { friends: Friend[]; blockedList: string[] } {
  const clean = idOrCode.trim().toUpperCase();
  const blocked = getBlockedUsers();
  if (!blocked.includes(clean)) {
    blocked.push(clean);
    localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(blocked));
  }

  // Eliminar de amigos si estaba guardado
  const current = getSavedFriends();
  const updated = current.filter(f => f.id !== idOrCode && f.code !== clean);
  saveFriends(updated);

  return { friends: updated, blockedList: blocked };
}

export function unblockUser(code: string): string[] {
  const clean = code.trim().toUpperCase();
  const blocked = getBlockedUsers().filter(c => c !== clean);
  localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(blocked));
  return blocked;
}

export function reportUser(
  friendCode: string,
  friendName: string,
  reason: "CONDUCTA_INAPROPIADA" | "NOMBRE_OFENSIVO" | "TRAMPA" | "OTRO",
  details?: string
): void {
  const reports: FriendReport[] = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || "[]");
  reports.push({
    reportedFriendCode: friendCode.toUpperCase(),
    reportedFriendName: friendName,
    reason,
    details,
    timestamp: Date.now()
  });
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));

  // Enviar reporte a Supabase para moderación de Google Play
  setTimeout(async () => {
    try {
      await supabase.from('user_reports').insert({
        reported_code: friendCode.toUpperCase(),
        reporter_id: getOrCreateUserId(),
        reason,
        details: details || `Reportado por usuario: ${friendName}`,
      });
    } catch (e) {
      console.warn('[SUPABASE] Reporte guardado localmente:', e);
    }
  }, 300);


  // Bloquear automáticamente al reportar para proteger al usuario
  blockUser(friendCode, friendName);
}


export function generateFriendInviteUrl(player: {
  name: string;
  code: string;
  avatar?: string;
  country?: string;
  countryFlag?: string;
}): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set("inviteFriendCode", player.code || "BIBLOS-FRIEND");
  params.set("friendName", player.name || "Un Amigo");
  if (player.avatar) params.set("friendAvatar", player.avatar);
  if (player.country) params.set("friendCountry", player.country);
  if (player.countryFlag) params.set("friendFlag", player.countryFlag);

  return `${baseUrl}?${params.toString()}`;
}

export function shareInviteToSocial(
  platform: "whatsapp" | "facebook" | "telegram" | "twitter" | "native",
  player: { name: string; code: string; avatar?: string; country?: string; countryFlag?: string }
): { opened: boolean; url: string; text: string } {
  const inviteUrl = generateFriendInviteUrl(player);
  const shareText = `🎲🕊️ ¡Hola! Juguemos una partida bíblica en Biblos Games. 📖✨ Agrégame como amigo y compitamos en vivo. Entra aquí:`;

  switch (platform) {
    case "whatsapp": {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + inviteUrl)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      return { opened: true, url: inviteUrl, text: shareText };
    }
    case "facebook": {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=400");
      return { opened: true, url: inviteUrl, text: shareText };
    }
    case "telegram": {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(tgUrl, "_blank", "noopener,noreferrer");
      return { opened: true, url: inviteUrl, text: shareText };
    }
    case "twitter": {
      const twText = `🎲🕊️ ¡Juguemos una partida bíblica en Biblos Games! 📖✨ Conéctate conmigo aquí:`;
      const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twText)}&url=${encodeURIComponent(inviteUrl)}`;
      window.open(twUrl, "_blank", "noopener,noreferrer");
      return { opened: true, url: inviteUrl, text: shareText };
    }
    case "native": {
      if (navigator.share) {
        navigator.share({
          title: "Biblos Games - ¡Juguemos una partida bíblica!",
          text: shareText,
          url: inviteUrl
        }).catch(() => {});
      }
      return { opened: true, url: inviteUrl, text: shareText };
    }
  }
}
