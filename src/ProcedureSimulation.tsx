import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { blockMessage, introMessage, stepDoneMessage } from './domain/procedures/coach';
import { ProcedureSession, type Check, type Context, type SessionResult } from './domain/procedures/ProcedureSession';
import type { Mode, ProcedureDef } from './domain/procedures/types';
import { createStablePatient } from './domain/procedures/stablePatient';
import { Simulator, type InteractableInfo } from './game/Simulator';
import { buildSupplyArea, type PropItem } from './game/world/ProcedureProps';
import { useI18n } from './i18n';
import { askCoach } from './services/ai/procedureCoachService';
import type { ChatTurn } from './services/ai';
import PatientChat from './ui/PatientChat';
import { StepsPanel, TrayPanel } from './ui/ProcedurePanels';
import ProcedureResults from './ui/ProcedureResults';
import Sheet from './ui/Sheet';
import StartOverlay from './ui/StartOverlay';
import TouchControls from './ui/TouchControls';

type PanelId = 'steps' | 'tray' | 'coach';

const BED_ANGLES_DEG = [0, 15, 30, 45, 60];
const ACTION_SECONDS = 2.2;
const isTextField = (el: EventTarget | null) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Where the player is, in terms the rules understand. */
function whereAmI(p: { x: number; z: number }) {
  const dx = Math.max(Math.abs(p.x) - 0.55, 0);
  const dz = Math.max(-2.5 - p.z, p.z + 0.3, 0); // the bed lies between z = -2.5 and -0.3
  return { nearBed: Math.hypot(dx, dz) <= 1.9, nearSanitizer: Math.hypot(p.x + 2.35, p.z + 3) <= 2.6 };
}

interface Props {
  def: ProcedureDef;
  mode: Mode;
  onRestart: () => void;
  onMenu: () => void;
}

export default function ProcedureSimulation({ def, mode, onRestart, onMenu }: Props) {
  const { t, lang, dir } = useI18n();
  const viewportRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulator | null>(null);
  const itemsRef = useRef(new Map<string, PropItem>());
  const toastTimer = useRef(0);
  const actionTimer = useRef(0);
  const bedIdx = useRef(0);

  const touch = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const session = useMemo(() => new ProcedureSession(def, mode, undefined, Date.now() % 100000), [def, mode]);
  const patient = useMemo(() => createStablePatient(def.titleEn), [def]);

  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [target, setTarget] = useState<InteractableInfo | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, bump] = useState(0);

  const practice = mode === 'practice';
  const coachState = useCallback(() => ({ session, lang }), [session, lang]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  const coachSays = useCallback((text: string) => setTurns((prev) => [...prev, { from: 'coach', text }]), []);

  const openPanel = useCallback((id: PanelId) => {
    simRef.current?.releaseCursor();
    setPanel(id);
  }, []);
  const closePanel = useCallback(() => {
    setPanel(null);
    if (!touch) simRef.current?.lock();
  }, [touch]);

  const finishRun = useCallback(
    (timedOut = false) => {
      window.clearTimeout(actionTimer.current);
      setBusy(null);
      setResult(session.finish(timedOut));
      setPanel(null);
      simRef.current?.releaseCursor();
    },
    [session],
  );

  const context = useCallback((): Context => {
    const sim = simRef.current;
    const where = sim ? whereAmI(sim.playerXZ()) : { nearBed: false, nearSanitizer: false };
    return { ...where, headAngleRad: (BED_ANGLES_DEG[bedIdx.current] * Math.PI) / 180 };
  }, []);

  /** Why an action did not happen: the coach points the way in practice; the exam only says it did not work. */
  const explain = useCallback(
    (check: Extract<Check, { ok: false }>) => {
      if (practice) {
        const text = blockMessage(coachState(), check);
        showToast(text.split('\n')[0]);
        coachSays(text);
        return;
      }
      if (check.reason === 'order' || check.reason === 'distractor') showToast(t('proc.exam.notNow'));
      else if (check.reason === 'equipment') showToast(t('proc.exam.equip'));
      else showToast(blockMessage(coachState(), check).split('\n')[0]);
    },
    [practice, coachState, showToast, coachSays, t],
  );

  const doAction = useCallback(
    (key: string) => {
      if (busy || result) return;
      const ctx = context();
      const check = session.check(key, ctx);
      if (!check.ok) {
        session.perform(key, ctx); // records the mistake
        explain(check);
        bump((n) => n + 1);
        return;
      }
      setBusy(key);
      setPanel(null);
      if (!touch) simRef.current?.lock();
      actionTimer.current = window.setTimeout(() => {
        const again = session.perform(key, context());
        setBusy(null);
        if (!again.ok) {
          showToast(t('proc.moved'));
          return;
        }
        const step = session.def.steps[session.performed[session.performed.length - 1].stepIndex];
        if (practice) {
          const text = stepDoneMessage(coachState(), step);
          showToast(text.split('\n')[0]);
          coachSays(text);
        } else {
          showToast(t('proc.stepDone', { n: session.doneCount }));
        }
        bump((n) => n + 1);
        if (session.finished) window.setTimeout(() => finishRun(false), 900);
      }, ACTION_SECONDS * 1000);
    },
    [busy, result, context, session, explain, touch, practice, coachState, showToast, coachSays, finishRun, t],
  );

  // What happens when E is pressed on something (kept in a ref so the simulator always calls the latest version)
  const interactRef = useRef<(tgt: InteractableInfo | null) => void>(() => undefined);
  interactRef.current = (tgt) => {
    if (!tgt) return;
    if (tgt.id.startsWith('item:')) {
      const id = tgt.id.slice(5);
      const prop = itemsRef.current.get(id);
      if (!prop || !session.pick(id).ok) return;
      simRef.current?.unregisterExtra(prop.root);
      prop.remove();
      showToast(t('proc.picked', { item: prop.label.split(' · ')[lang === 'ar' ? 1 : 0] }));
      bump((n) => n + 1);
    } else if (tgt.id === 'bed-control') {
      bedIdx.current = (bedIdx.current + 1) % BED_ANGLES_DEG.length;
      simRef.current?.setHeadTarget((BED_ANGLES_DEG[bedIdx.current] * Math.PI) / 180);
      showToast(t('proc.bed', { deg: BED_ANGLES_DEG[bedIdx.current] }));
    } else if (tgt.id === 'sanitizer') {
      showToast(t('proc.hands'));
    } else if (tgt.id === 'curtain') {
      const closed = simRef.current?.toggleCurtains();
      showToast(t(closed ? 'toast.curtainClosed' : 'toast.curtainOpened'));
    } else if (tgt.id === 'patient') {
      openPanel('steps');
    }
  };

  // ---- 3D simulator lifecycle ----
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let sim: Simulator;
    try {
      sim = new Simulator(el, patient, {
        onTargetChange: setTarget,
        onLockChange: (isLocked) => {
          setLocked(isLocked);
          if (isLocked) setStarted(true);
        },
        onInteract: (tgt) => interactRef.current(tgt),
        onTick: () => undefined,
        onAlarmChange: () => undefined,
      });
    } catch (e) {
      console.error(e);
      setError('error.webgl');
      return;
    }
    const area = buildSupplyArea(session);
    sim.addExtras(area.group, area.colliders);
    for (const item of area.items) {
      itemsRef.current.set(item.id, item);
      sim.registerExtra(item.root, { id: `item:${item.id}`, labelKey: '', label: item.label }, item.setHighlight);
    }
    sim.registerExtra(area.bedControl, { id: 'bed-control', labelKey: '', label: 'Bed control · مفتاح السرير' }, area.setBedControlHighlight);
    sim.addUpdater(area.updateLabels);
    sim.setHeadTarget(0);
    simRef.current = sim;
    sim.start();
    if (import.meta.env.DEV) (window as unknown as { __sim?: Simulator }).__sim = sim; // dev-only: lets tests drive the camera
    const items = itemsRef.current;
    return () => {
      window.clearTimeout(actionTimer.current);
      items.clear();
      sim.dispose();
      simRef.current = null;
    };
  }, [patient, session]);

  useEffect(() => {
    if (practice) setTurns([{ from: 'coach', text: introMessage({ session, lang }) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice, session]);

  useEffect(() => {
    simRef.current?.setRunning(started && !result && !typing && (locked || panel !== null));
  }, [started, result, locked, panel, typing]);

  // exam clock
  useEffect(() => {
    if (!started || result || mode !== 'exam') return;
    const id = window.setInterval(() => {
      bump((n) => n + 1);
      if (session.timeLeft() === 0) finishRun(true);
    }, 500);
    return () => window.clearInterval(id);
  }, [started, result, mode, session, finishRun]);

  // keys: Q steps, R tray, T coach, E / Esc closes a panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTextField(e.target) && e.code !== 'Escape') return;
      if (panel && (e.code === 'KeyE' || e.code === 'Escape')) {
        e.preventDefault();
        closePanel();
        return;
      }
      if (!started || result || panel || e.repeat) return;
      if (e.code === 'KeyQ') openPanel('steps');
      else if (e.code === 'KeyR') openPanel('tray');
      else if (e.code === 'KeyT' && practice) openPanel('coach');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, started, result, practice, openPanel, closePanel]);

  const start = () => {
    const sim = simRef.current;
    if (!sim) return;
    sim.startAudio();
    if (touch) {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
      (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')?.catch(() => undefined);
      sim.startTouch();
    } else {
      sim.lock();
    }
  };

  const confirmFinish = () => {
    if (session.finished || window.confirm(t('proc.finish.confirm'))) finishRun(false);
  };

  const title = lang === 'ar' ? def.titleAr : def.titleEn;
  const nextStep = session.nextStep();
  const left = session.timeLeft();
  const busyStep = busy ? session.actions.find((a) => a.key === busy) : null;
  const busyDetail = busyStep && practice && busyStep.stepIndex !== null ? def.steps[busyStep.stepIndex] : null;
  const showStart = (!locked && !panel && !result) || error !== null;

  return (
    <div className="app" dir={dir} onContextMenu={(e) => e.preventDefault()}>
      <div className="viewport" ref={viewportRef} />

      {!error && started && !result && (
        <>
          <div className="proc-hud">
            <strong>{title}</strong>
            <span className={`badge badge--${mode}`}>{t(`menu.mode.${mode}`)}</span>
            <span>{t('proc.done', { n: session.doneCount, total: def.steps.length })}</span>
            {left !== null && <span className={`timer${left < 60 ? ' timer--low' : ''}`}>{t('proc.timeLeft')}: {mmss(left)}</span>}
            {practice && nextStep && def.ordered && (
              <div className="proc-next">
                <small>{t('proc.step', { n: nextStep.n, total: def.steps.length })}</small>
                <b>{lang === 'ar' ? nextStep.ar : nextStep.en}</b>
              </div>
            )}
            {!touch && <small>{t(`proc.keys.${mode}`)}</small>}
          </div>
          {!panel && <div className={`crosshair${target ? ' crosshair--active' : ''}`} aria-hidden="true" />}
          {target && !panel && !busy && (
            <div className="hud__prompt">
              <kbd>E</kbd> {target.label ?? t(target.labelKey)}
            </div>
          )}
          {busy && (
            <div className="proc-busy" role="status">
              <b>{busyDetail ? (lang === 'ar' ? busyDetail.ar : busyDetail.en) : t('proc.doing')}</b>
              {busyDetail && lang === 'ar' && <small>{busyDetail.doing}</small>}
              <div className="proc-bar"><i style={{ animationDuration: `${ACTION_SECONDS}s` }} /></div>
            </div>
          )}
        </>
      )}

      {!error && touch && locked && !panel && !result && (
        <>
          <TouchControls
            canInteract={target !== null}
            onMove={(x, y) => simRef.current?.setMoveInput(x, y)}
            onLook={(dx, dy) => simRef.current?.look(dx, dy)}
            onInteract={() => simRef.current?.interact()}
            onPause={() => simRef.current?.stopTouch()}
            onChat={() => openPanel(practice ? 'coach' : 'steps')}
            muted={false}
            onToggleMute={() => undefined}
          />
          <div className="proc-touchbtns">
            <button type="button" onClick={() => openPanel('steps')}>☰ {t('proc.steps')}</button>
            <button type="button" onClick={() => openPanel('tray')}>🧰 {t('proc.tray')}</button>
          </div>
        </>
      )}

      {panel === 'steps' && <StepsPanel session={session} touch={touch} busy={busy !== null} onClose={closePanel} onDo={doAction} onFinish={confirmFinish} />}
      {panel === 'tray' && <TrayPanel session={session} touch={touch} onClose={closePanel} />}
      {panel === 'coach' && practice && (
        <Sheet title={t('pcoach.title')} subtitle={t('pcoach.sub')} touch={touch} onClose={closePanel}>
          <PatientChat
            peer="coach"
            turns={turns}
            onTurns={setTurns}
            ask={async (q, h) => ({ text: await askCoach(coachState(), q, h) })}
            onTypingChange={setTyping}
          />
        </Sheet>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {showStart && (
        <StartOverlay
          introKey={`proc.intro.${mode}`}
          started={started}
          error={error ? t(error) : null}
          touch={touch}
          onStart={start}
          onFinish={() => finishRun(false)}
          onBack={onMenu}
        />
      )}
      {result && <ProcedureResults session={session} result={result} onRestart={onRestart} onMenu={onMenu} />}
    </div>
  );
}
