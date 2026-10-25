import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { orientation, setSpot, useSettings, type ControlId } from '../settings';
import { stopEditing } from '../uiState';
import { sizeVars, spotStyle, useOrientation } from './touchLayout';

/**
 * Drag the on-screen controls to where the thumbs like them. It sits exactly over the game screen, so a spot is a share
 * of that screen (the same shares are used again in the game). Each way of holding the phone has its own layout.
 */
export default function ControlEditor() {
  const { t, dir } = useI18n();
  const s = useSettings();
  const orient = useOrientation();
  const spots = s.layout[orient];
  const [rect, setRect] = useState(() => stageRect());
  const drag = useRef<{ id: ControlId; pid: number } | null>(null);

  useEffect(() => {
    const on = () => setRect(stageRect());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.pid !== e.pointerId) return;
    setSpot(orientation(), d.id, { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  };
  const grab = (id: ControlId) => (e: React.PointerEvent) => {
    drag.current = { id, pid: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const release = () => (drag.current = null);

  return (
    <div className="editor" dir={dir} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} onPointerMove={move} onPointerUp={release} onPointerCancel={release}>
      <div className={`touch touch--edit${s.leftHanded ? ' touch--lefty' : ''}`} style={sizeVars(s)}>
        <div className="joystick" style={spotStyle(spots.joy)} onPointerDown={grab('joy')}>
          <span className="joystick__arrows" aria-hidden="true">
            <i>▲</i>
            <i>▼</i>
            <i>◀</i>
            <i>▶</i>
          </span>
          <div className="joystick__knob" />
          <span className="tc-label">{t('ctl.label.move')}</span>
        </div>
        <div className="touch__act touch__act--ready" style={spotStyle(spots.act)} onPointerDown={grab('act')}>
          E<span className="tc-label">{t('ctl.label.use')}</span>
        </div>
        <div className="touch__top" style={spotStyle(spots.top)} onPointerDown={grab('top')}>
          <button type="button" tabIndex={-1}>⏸</button>
          <button type="button" tabIndex={-1}>🔊</button>
          <button type="button" tabIndex={-1}>☰</button>
          <button type="button" tabIndex={-1}>⚙</button>
        </div>
      </div>
      <div className="editor__bar">
        <p>
          {t('set.editHint')} <small>({t('set.editFor')})</small>
        </p>
        <div>
          <button type="button" onClick={() => (['joy', 'act', 'top'] as const).forEach((id) => setSpot(orientation(), id, null))}>
            ↺ {t('set.editReset')}
          </button>
          <button type="button" className="editor__done" onClick={stopEditing}>
            ✓ {t('set.editDone')}
          </button>
        </div>
      </div>
    </div>
  );
}

function stageRect(): { left: number; top: number; width: number; height: number } {
  const el = document.querySelector('.stage');
  const r = el ? el.getBoundingClientRect() : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}
