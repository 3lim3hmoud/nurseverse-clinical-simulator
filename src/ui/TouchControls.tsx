import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { useI18n } from '../i18n';

const RADIUS_RATIO = 0.38; // knob travel as a share of the joystick width
const DEADZONE = 0.14;

function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (e: PointerEvent) => {
    const r = baseRef.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const radius = r.width * RADIUS_RATIO;
    const d = Math.hypot(dx, dy);
    if (d > radius) {
      dx = (dx / d) * radius;
      dy = (dy / d) * radius;
    }
    setKnob({ x: dx, y: dy });
    const nx = dx / radius;
    const ny = -dy / radius;
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

const TAP_MOVE = 10; // px: a finger that moves less than this and lifts quickly is a tap, not a look-around
const TAP_MS = 420;

function LookZone({ onLook, onTap }: { onLook: (dx: number, dy: number) => void; onTap: (x: number, y: number) => void }) {
  const last = useRef<{ id: number; x: number; y: number; x0: number; y0: number; t0: number; moved: number } | null>(null);
  return (
    <div
      className="touch__look"
      onPointerDown={(e) => {
        last.current = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const l = last.current;
        if (!l || l.id !== e.pointerId) return;
        const dx = e.clientX - l.x;
        const dy = e.clientY - l.y;
        l.moved = Math.max(l.moved, Math.hypot(e.clientX - l.x0, e.clientY - l.y0));
        if (l.moved >= TAP_MOVE) onLook(dx, dy); // small wobbles of a tapping finger do not turn the view
        l.x = e.clientX;
        l.y = e.clientY;
      }}
      onPointerUp={(e) => {
        const l = last.current;
        last.current = null;
        if (l && l.id === e.pointerId && l.moved < TAP_MOVE && performance.now() - l.t0 < TAP_MS) onTap(e.clientX, e.clientY);
      }}
      onPointerCancel={() => (last.current = null)}
    />
  );
}

interface Props {
  canInteract: boolean;
  onMove: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
  /** a quick tap on the 3D view: uses what is under the finger */
  onTap: (x: number, y: number) => void;
  onInteract: () => void;
  onPause: () => void;
  muted: boolean;
  onToggleMute: () => void;
  dashOpen: boolean;
  onToggleDash: () => void;
}

export default function TouchControls({ canInteract, onMove, onLook, onTap, onInteract, onPause, muted, onToggleMute, dashOpen, onToggleDash }: Props) {
  const { t } = useI18n();
  return (
    <div className="touch">
      <LookZone onLook={onLook} onTap={onTap} />
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
        <button type="button" onClick={onPause} aria-label={t('touch.pause')}>
          ⏸
        </button>
        <button type="button" onClick={onToggleMute} aria-label={t(muted ? 'touch.soundOff' : 'touch.soundOn')}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button type="button" onClick={onToggleDash} aria-label={t(dashOpen ? 'dash.hide' : 'dash.show')} aria-pressed={dashOpen}>
          ☰
        </button>
      </div>
    </div>
  );
}
