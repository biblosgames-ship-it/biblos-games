import { AdMob } from '@capacitor-community/admob';

const INTERSTITIAL_AD_ID = 'ca-app-pub-9854726623821294/1700648330';
const REWARDED_AD_ID = 'ca-app-pub-9854726623821294/4764910893';

let interstitialReady = false;
let adInitialized = false;

export async function initAdMob(): Promise<void> {
  if (adInitialized) return;
  try {
    await (AdMob as any).initialize({
      initializeForTesting: false,
    });
    adInitialized = true;
    preloadInterstitial();
    preloadRewardedAd();
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
}

export async function preloadInterstitial(): Promise<void> {
  try {
    await (AdMob as any).prepareInterstitial({ adId: INTERSTITIAL_AD_ID });
    interstitialReady = true;
  } catch (e) {
    console.warn('Interstitial preload failed:', e);
    interstitialReady = false;
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  if (!interstitialReady) {
    await preloadInterstitial();
  }
  if (!interstitialReady) return false;

  try {
    await (AdMob as any).showInterstitial();
    interstitialReady = false;
    preloadInterstitial();
    return true;
  } catch (e) {
    console.warn('Interstitial show failed:', e);
    interstitialReady = false;
    return false;
  }
}

let questionsSinceLastAd = 0;

export function onQuestionAnswered(matchDuration?: string): void {
  if (matchDuration === 'INFINITO') return;
  const isLongGame = matchDuration === '10_MIN' || matchDuration === '15_MIN';
  const interval = isLongGame ? 10 : 999;

  questionsSinceLastAd++;
  if (questionsSinceLastAd >= interval) {
    questionsSinceLastAd = 0;
    showInterstitialAd();
  }
}

export function resetAdCounter(): void {
  questionsSinceLastAd = 0;
}

// --- Rewarded Video Ad ---

let rewardedReady = false;

const REWARD_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes between rewarded ads

export async function preloadRewardedAd(): Promise<void> {
  try {
    await (AdMob as any).prepareRewardVideoAd({ adId: REWARDED_AD_ID });
    rewardedReady = true;
  } catch (e) {
    console.warn('Rewarded ad preload failed:', e);
    rewardedReady = false;
  }
}

export async function showRewardedAd(): Promise<boolean> {
  if (!rewardedReady) {
    await preloadRewardedAd();
  }
  if (!rewardedReady) return false;

  try {
    await (AdMob as any).showRewardVideoAd();
    rewardedReady = false;
    preloadRewardedAd(); // Preload next one
    return true;
  } catch (e) {
    console.warn('Rewarded ad show failed:', e);
    rewardedReady = false;
    return false;
  }
}

export function canWatchRewardedAd(): boolean {
  const lastWatched = parseInt(localStorage.getItem('biblos_last_rewarded_ad') || '0', 10);
  return Date.now() - lastWatched >= REWARD_COOLDOWN_MS;
}

export function markRewardedAdWatched(): void {
  localStorage.setItem('biblos_last_rewarded_ad', Date.now().toString());
}

export function getTimeUntilNextRewardedAd(): number {
  const lastWatched = parseInt(localStorage.getItem('biblos_last_rewarded_ad') || '0', 10);
  const elapsed = Date.now() - lastWatched;
  return Math.max(0, REWARD_COOLDOWN_MS - elapsed);
}
