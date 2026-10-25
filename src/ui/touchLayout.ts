import type { CSSProperties } from 'react';
import { orientation, type Orient, type Settings, type Spot } from '../settings';
import { useEffect, useState } from 'react';

/** Style that puts a control's centre at a spot chosen by the player (undefined = where the stylesheet puts it). */
export const spotStyle = (s?: Spot): CSSProperties | undefined =>
  s ? { left: `${s.x * 100}%`, top: `${s.y * 100}%`, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' } : undefined;

/** CSS variables for the sizes and the visibility chosen in the settings. */
export const sizeVars = (s: Settings): CSSProperties =>
  ({ '--joy': s.joySize, '--act': s.actSize, '--op': s.opacity }) as CSSProperties;

/** 'landscape' or 'portrait', following the phone as it is turned. */
export function useOrientation(): Orient {
  const [o, setO] = useState<Orient>(orientation);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const on = () => setO(mq.matches ? 'portrait' : 'landscape');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return o;
}
