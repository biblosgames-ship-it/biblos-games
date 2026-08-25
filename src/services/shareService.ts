import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { toPng } from 'html-to-image';
import { UserProfile } from './userProfile';

export const downloadElementAsImage = async (
  elementId: string,
  fileName: string = 'biblos-tarjeta.png'
) => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (e) {
    console.error('Error downloading image', e);
  }
};

export const captureAndShareElement = async (
  elementId: string,
  title: string,
  text: string,
  fileName: string = 'biblos-resultado.png'
) => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });

    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title,
        text,
        url: dataUrl,
        dialogTitle: title,
      });
      return;
    }

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return;
    }

    // Si el navegador no permite abrir el diálogo de compartir, descarga directamente
    await downloadElementAsImage(elementId, fileName);
  } catch (e) {
    console.error('Error capturing and sharing image', e);
  }
};

export const shareGameResults = async (profile: UserProfile, accuracy: number, correct: number, total: number) => {
  const text = `🎮 ¡Mira mis resultados en Biblos Games!\n🎯 Precisión: ${accuracy}%\n✅ Aciertos: ${correct}/${total}\n¡Juégalo tú también! 📜✨`;
  await captureAndShareElement('final-summary-card', 'Mis Resultados en Biblos Games', text, 'biblos-resultado.png');
};

export const downloadGameResultsImage = async () => {
  await downloadElementAsImage('final-summary-card', 'biblos-resultado.png');
};

export const shareUserProfile = async (profile: UserProfile) => {
  const text = `📜 Mi Perfil Bíblico en Biblos Games\n👤 Jugador: ${profile.name}\n🎯 Precisión: ${profile.accuracy}%\n¡Aprende sobre la Biblia! 📜🎮`;
  await captureAndShareElement('user-profile-card', 'Mi Perfil en Biblos Games', text, 'biblos-perfil.png');
};

export const downloadUserProfileImage = async () => {
  await downloadElementAsImage('user-profile-card', 'biblos-perfil.png');
};

export const shareFriendInviteCard = async (playerName: string, inviteUrl: string) => {
  const text = `🎲🕊️ ¡Hola! Juguemos una partida bíblica en Biblos Games. 📖✨ Agrégame como amigo y compitamos en vivo. Entra aquí:\n${inviteUrl}`;
  await captureAndShareElement('biblos-friend-invite-card', '¡Juguemos en Biblos Games!', text, 'invitacion-biblos-games.png');
};

export const downloadFriendInviteCard = async () => {
  await downloadElementAsImage('biblos-friend-invite-card', 'invitacion-biblos-games.png');
};
