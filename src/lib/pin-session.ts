export type PinRole = "cuisine" | "caisse";

const TOKEN_KEY = "resto_pin_token";
const ROLE_KEY = "resto_pin_role";

function tokenKey(role: PinRole): string {
  return `${TOKEN_KEY}_${role}`;
}

export function savePinSession(token: string, role: PinRole) {
  localStorage.setItem(tokenKey(role), token);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function readPinToken(role: PinRole): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(tokenKey(role));
  if (token) return token;

  // Migre une ancienne session partagée uniquement si elle appartient à cet écran.
  const legacyRole = localStorage.getItem(ROLE_KEY);
  const legacyToken = localStorage.getItem(TOKEN_KEY);
  if (legacyRole === role && legacyToken) {
    localStorage.setItem(tokenKey(role), legacyToken);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    return legacyToken;
  }
  return null;
}

export function clearPinSession(role: PinRole) {
  localStorage.removeItem(tokenKey(role));
  if (localStorage.getItem(ROLE_KEY) === role) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  }
}

/** Bip de notification (aucun fichier audio nécessaire). */
export function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1170].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + index * 0.18);
      osc.stop(now + index * 0.18 + 0.35);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch {
    // Son indisponible : on ignore.
  }
}
