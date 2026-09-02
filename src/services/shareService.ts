import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { toPng } from 'html-to-image';
import { UserProfile } from './userProfile';
import { generateFriendInviteUrl } from './friendsService';

/**
 * Copia texto al portapapeles de manera infalible en navegadores web modernos y legacy.
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API failed, trying fallback textarea...', err);
  }

  // Fallback con elemento textarea temporal
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
};

/**
 * Comparte texto y URL usando Capacitor en nativo, Web Share API en navegadores compatibles,
 * o copia al portapapeles como respaldo seguro.
 */
export const shareOrCopy = async (options: {
  title: string;
  text: string;
  url?: string;
}): Promise<{ shared: boolean; copied: boolean }> => {
  const targetUrl = options.url || window.location.origin;
  const fullTextWithLink = options.text.includes(targetUrl)
    ? options.text
    : `${options.text}\n\n👉 Juega gratis y entra aquí:\n${targetUrl}`;

  // 1. Plataforma Nativa Capacitor (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: options.title,
        text: fullTextWithLink,
        url: targetUrl,
        dialogTitle: options.title,
      });
      return { shared: true, copied: false };
    } catch (e: any) {
      // Si el usuario canceló el diálogo nativo
      if (e?.message?.includes('canceled') || e?.message?.includes('cancelled')) {
        return { shared: false, copied: false };
      }
      console.warn('Capacitor Share error:', e);
    }
  }

  // 2. Web Share API (Navegadores móviles y navegadores web compatibles con HTTPS en Railway)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options.title,
        text: fullTextWithLink,
        url: targetUrl,
      });
      return { shared: true, copied: false };
    } catch (e: any) {
      // AbortError ocurre cuando el usuario cierra/cancela el diálogo del sistema
      if (e?.name === 'AbortError') {
        return { shared: false, copied: false };
      }
      console.warn('Web Share API failed, using clipboard fallback:', e);
    }
  }

  // 3. Respaldo para Navegadores de escritorio sin Web Share API: Copiar al portapapeles
  const copied = await copyTextToClipboard(fullTextWithLink);
  return { shared: false, copied };
};

/**
 * Descarga un elemento DOM como imagen PNG
 */
export const downloadElementAsImage = async (
  elementId: string,
  fileName: string = 'biblos-tarjeta.png'
): Promise<boolean> => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    const dataUrl = await toPng(element, { 
      cacheBust: false, 
      pixelRatio: 2,
      skipFonts: false
    });
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error('Error downloading image', e);
    return false;
  }
};

/**
 * Captura un elemento DOM e intenta compartirlo (con enlace directo garantizado)
 */
export const captureAndShareElement = async (
  elementId: string,
  title: string,
  text: string,
  fileName: string = 'biblos-resultado.png',
  shareUrl?: string
): Promise<{ shared: boolean; copied: boolean }> => {
  const targetUrl = shareUrl || window.location.origin;
  return await shareOrCopy({ title, text, url: targetUrl });
};

/**
 * Comparte los resultados de partida
 */
export const shareGameResults = async (
  profile: UserProfile, 
  accuracy: number, 
  correct: number, 
  total: number
): Promise<{ shared: boolean; copied: boolean }> => {
  const targetUrl = window.location.origin;
  const text = `🎮 ¡Mira mis resultados en Biblos Games! 🎲🕊️\n` +
    `👤 Jugador: ${profile.name || 'Jugador Bíblico'}\n` +
    `🎯 Precisión: ${accuracy}%\n` +
    `✅ Aciertos: ${correct}/${total}\n\n` +
    `👉 ¡Juégalo tú también gratis entrando aquí:\n${targetUrl}`;

  return await shareOrCopy({
    title: 'Mis Resultados en Biblos Games',
    text,
    url: targetUrl
  });
};

export const downloadGameResultsImage = async (): Promise<boolean> => {
  return await downloadElementAsImage('final-summary-card', 'biblos-resultado.png');
};

/**
 * Comparte el perfil del usuario de manera infalible con link de acceso
 */
export const shareUserProfile = async (
  profile: UserProfile,
  customInviteUrl?: string
): Promise<{ shared: boolean; copied: boolean }> => {
  const myCode = `BIBLOS-${(profile.name || 'JUGADOR').substring(0, 3).toUpperCase()}-${Math.floor(1000 + (profile.rating || 1000) % 9000)}`;
  const inviteUrl = customInviteUrl || generateFriendInviteUrl({
    name: profile.name || 'Jugador Bíblico',
    code: myCode,
    avatar: profile.avatar || '/avatars/david.jpg',
    country: profile.country || 'DO',
    countryFlag: profile.countryFlag || '🇩🇴'
  });

  const text = `📜 ¡Hola! Este es mi perfil bíblico en Biblos Games 🎲🕊️\n` +
    `👤 Jugador: ${profile.name || 'Jugador Bíblico'}\n` +
    `🎯 Precisión: ${profile.accuracy || 0}%\n` +
    `🏆 Rating ELO: ${profile.rating || 1000} pts\n` +
    `⭐ Rango: ${profile.rank || 'Explorador Bíblico'}\n` +
    `🔥 Racha: ${profile.streak || 0} días\n\n` +
    `👉 ¡Agrégame como amigo y juguemos en vivo aquí:\n${inviteUrl}`;

  return await shareOrCopy({
    title: `Biblos Games - Perfil de ${profile.name || 'Jugador'}`,
    text,
    url: inviteUrl
  });
};

export const downloadUserProfileImage = async (): Promise<boolean> => {
  return await downloadElementAsImage('user-profile-card', 'biblos-perfil.png');
};

/**
 * Comparte la tarjeta o invitación de amistad con link de acceso
 */
export const shareFriendInviteCard = async (
  playerName: string, 
  inviteUrl: string
): Promise<{ shared: boolean; copied: boolean }> => {
  const text = `🎲🕊️ ¡Hola! Juguemos una partida bíblica en Biblos Games. 📖✨\n` +
    `👤 Jugador: ${playerName}\n\n` +
    `👉 Agrégame como amigo y compitamos en vivo entrando aquí:\n${inviteUrl}`;

  return await shareOrCopy({
    title: '¡Juguemos en Biblos Games!',
    text,
    url: inviteUrl
  });
};

export const downloadFriendInviteCard = async (): Promise<boolean> => {
  return await downloadElementAsImage('biblos-friend-invite-card', 'invitacion-biblos-games.png');
};
