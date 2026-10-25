import { useEffect, useState, useSyncExternalStore } from 'react';

/** The browser's "install this app" offer (Chrome / Edge / Android), kept until the player taps the install button. */
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
let installed = false;
let updateReady: ServiceWorker | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function setupPwa(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });

  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        const watch = (sw: ServiceWorker | null) => {
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            // a new version finished installing while an old one is running: offer it
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              updateReady = sw;
              emit();
            }
          });
        };
        watch(reg.installing);
        reg.addEventListener('updatefound', () => watch(reg.installing));
        // check for a new version whenever the app comes back to the front
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update().catch(() => undefined);
        });
      })
      .catch(() => undefined); // no service worker (private mode, old browser): the app still works online
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}

export function reloadForUpdate(): void {
  updateReady?.postMessage('skip-waiting');
}

export async function promptInstall(): Promise<void> {
  const e = deferred;
  if (!e) return;
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'accepted') installed = true;
  deferred = null;
  emit();
}

export interface PwaState {
  /** the browser can show its install dialog */
  canInstall: boolean;
  /** iPhone / iPad: there is no dialog, so we explain the Share menu */
  showIosHint: boolean;
  installed: boolean;
  updateReady: boolean;
}

let snapshot: PwaState = { canInstall: false, showIosHint: false, installed: false, updateReady: false };
function compute(): PwaState {
  const standalone = isStandalone() || installed;
  const next: PwaState = { canInstall: !standalone && deferred !== null, showIosHint: !standalone && isIos(), installed: standalone, updateReady: updateReady !== null };
  if (next.canInstall !== snapshot.canInstall || next.showIosHint !== snapshot.showIosHint || next.installed !== snapshot.installed || next.updateReady !== snapshot.updateReady) snapshot = next;
  return snapshot;
}

export function usePwa(): PwaState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    compute,
    compute,
  );
}

/** Full-screen helpers (not available on iPhone Safari, where the installed app is already full screen). */
export const canFullscreen = (): boolean => typeof document.documentElement.requestFullscreen === 'function';

export function useFullscreen(): { on: boolean; toggle: () => void } {
  const [on, setOn] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const h = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  return {
    on,
    toggle: () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else
        void document.documentElement.requestFullscreen().then(() => {
          // a game like this is meant to be held sideways
          void (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => undefined);
        });
    },
  };
}
