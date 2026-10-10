import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { useI18n } from '../i18n';

const RADIUS = 48;
const DEADZONE = 0.14;

interface Props {
  canInteract: boolean;
  onMove: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
  onInteract: () => void;
  onPause: () => void;
  onChat: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (e: PointerEvent) => {
    const r = baseRef.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    const nx = dx / RADIUS;
    const ny = -dy / RADIUS;
    if (Math.hypot(nx, ny) < DEADZONE) onMove(0, 0);
    else onMove(nx, ny);
  };

  const end = () => {
    activeId.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      ref={baseRef}
      className="joystick"
      aria-label="Move"
      onPointerDown={(e) => {
        activeId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (activeId.current === e.pointerId) update(e);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

function LookZone({ onLook }: { onLook: (dx: number, dy: number) => void }) {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  return (
    <div
      className="touch__look"
      onPointerDown={(e) => {
        last.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const l = last.current;
        if (!l || l.id !== e.pointerId) return;
        onLook(e.clientX - l.x, e.clientY - l.y);
        l.x = e.clientX;
        l.y = e.clientY;
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
    />
  );
}

export default function TouchControls({ canInteract, onMove, onLook, onInteract, onPause, onChat, muted, onToggleMute }: Props) {
  const { t } = useI18n();
  return (
    <div className="touch">
      <LookZone onLook={onLook} />
      <Joystick onMove={onMove} />
      <button
        type="button"
        className={`touch__act${canInteract ? ' touch__act--ready' : ''}`}
        aria-label="Interact"
        onPointerDown={(e) => {
          e.preventDefault();
          onInteract();
        }}
      >
        E
      </button>
      <div className="touch__top">
        <button type="button" onClick={onPause}>
          {t('touch.pause')}
        </button>
        <button type="button" onClick={onChat}>
          💬 {t('hud.chat')}
        </button>
        <button type="button" onClick={onToggleMute}>
          {t(muted ? 'touch.soundOff' : 'touch.soundOn')}
        </button>
      </div>
    </div>
  );
}
