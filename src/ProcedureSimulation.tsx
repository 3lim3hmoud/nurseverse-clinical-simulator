import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { blockMessage, introMessage, stepDoneMessage } from './domain/procedures/coach';
import { shortTitle } from './domain/procedures/format';
import { currentObjective, type TableInfo } from './domain/procedures/guide';
import { HYGIENE_STATION, whereAmI } from './domain/procedures/layoutPoints';
import { effectOf } from './domain/procedures/stepEffects';
import * as THREE from 'three';
import { ProcedureSession, type Check, type Context, type SessionResult } from './domain/procedures/ProcedureSession';
import type { Mode, ProcedureDef } from './domain/procedures/types';
import { createStablePatient } from './domain/procedures/stablePatient';
import { Simulator, type InteractableInfo } from './game/Simulator';
import type { RunProgress } from './game/hands/HandsRun';
import HandWashCard from './ui/HandWashCard';
import { buildSupplyArea, type PropItem, type SupplyArea } from './game/world/ProcedureProps';
import { useI18n } from './i18n';
import { askCoach } from './services/ai/procedureCoachService';
import type { ChatTurn } from './services/ai';
import Dashboard, { type DashTab } from './ui/Dashboard';
import Hud from './ui/Hud';
import HowToCard from './ui/HowToCard';
import MiniMap from './ui/MiniMap';
import PatientChat from './ui/PatientChat';
import { StepsTab, TrayTab } from './ui/ProcedurePanels';
import ProcedureResults from './ui/ProcedureResults';
import StartOverlay from './ui/StartOverlay';
import TouchControls from './ui/TouchControls';
import { openSettings } from './uiState';
import { panelStartsOpen } from './settings';

type TabId = 'steps' | 'map' | 'tray' | 'coach';

const BED_ANGLES_DEG = [0, 15, 30, 45, 60];
const ACTION_SECONDS = 2.2;
/** Dev-only shortcut so automated runs do not wait for the progress bar. */
const actionSeconds = () => (import.meta.env.DEV && (window as unknown as { __quick?: boolean }).__quick ? 0.3 : ACTION_SECONDS);
/** Dev-only: run the hand wash fast in automated tests. */
const devQuickWash = () => import.meta.env.DEV && (window as unknown as { __quick?: boolean }).__quick === true;
const isTextField = (el: EventTarget | null) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const HOWTO_KEY = 'nv_howto_v1';
const seenHowTo = () => {
  try {
    return localStorage.getItem(HOWTO_KEY) === '1';
  } catch {
    return false;
  }
};

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
  const washKey = useRef<string | null>(null);
  const washFastRef = useRef(false);

  const touch = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const session = useMemo(() => new ProcedureSession(def, mode, undefined, Date.now() % 100000), [def, mode]);
  const patient = useMemo(() => createStablePatient(def), [def]);

  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [target, setTarget] = useState<InteractableInfo | null>(null);
  /** The dashboard tab on show. */
  const [tab, setTab] = useState<TabId>('steps');
  /** Desktop only: non-null while the mouse is free to click inside the dashboard (the room is paused for the mouse). */
  const [panel, setPanel] = useState<TabId | null>(null);
  const [dashOpen, setDashOpen] = useState(() => panelStartsOpen(touch));
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, bump] = useState(0);
  const [pose, setPose] = useState({ x: 0, z: 3.4, yaw: 0 });
  const [layout, setLayout] = useState<{ tables: TableInfo[]; rects: SupplyArea['rects'] } | null>(null);
  const [headDeg, setHeadDeg] = useState(0);
  const [howto, setHowto] = useState(false);
  const [muted, setMuted] = useState(false);
  /** Set while the nurse is washing her hands at the sink (the WHO technique plays out step by step). */
  const [wash, setWash] = useState<RunProgress | null>(null);
  const [washFast, setWashFast] = useState(false);
  const areaRef = useRef<SupplyArea | null>(null);

  const practice = mode === 'practice';
  const coachState = useCallback(() => ({ session, lang }), [session, lang]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  const coachSays = useCallback((text: string) => setTurns((prev) => [...prev, { from: 'coach', text }]), []);

  /** Show a dashboard tab. On a computer this also frees the mouse so the tab can be used (E or Esc goes back to the room). */
  const openPanel = useCallback(
    (id: TabId) => {
      setTab(id);
      setDashOpen(true);
      if (touch) return;
      simRef.current?.releaseCursor();
      setPanel(id);
    },
    [touch],
  );
  const closePanel = useCallback(() => {
    setPanel(null);
    if (!touch) simRef.current?.lock();
  }, [touch]);
  const selectTab = useCallback(
    (id: TabId) => {
      setTab(id);
      if (!touch && panel) setPanel(id);
    },
    [touch, panel],
  );

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

  /** The step is over (the progress bar ran out, or the hand wash finished): do it for real and tell the nurse. */
  const complete = useCallback(
    (key: string) => {
      const again = session.perform(key, context());
      setBusy(null);
      if (!again.ok) {
        showToast(t('proc.moved'));
        return;
      }
      const step = session.def.steps[session.performed[session.performed.length - 1].stepIndex];
      const effect = effectOf(step);
      if (effect) {
        if (effect.delta) patient.addTransient(effect.delta, effect.rampSec ?? 3, effect.holdSec ?? 6, effect.decaySec ?? 10);
        if (effect.sound) simRef.current?.patientSound(effect.sound);
      }
      if (practice) {
        const text = stepDoneMessage(coachState(), step);
        showToast(text.split('\n')[0]);
        coachSays(text);
      } else {
        showToast(t('proc.stepDone', { n: session.doneCount }));
      }
      bump((n) => n + 1);
      if (session.finished) window.setTimeout(() => finishRun(false), 900);
    },
    [session, context, showToast, t, patient, practice, coachState, coachSays, finishRun],
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
      const stepNow = session.actions.find((a) => a.key === key);
      const kind = stepNow?.stepIndex != null ? session.def.steps[stepNow.stepIndex].kind : 'bedside';
      if (!touch) simRef.current?.lock();
      const sim = simRef.current;
      const stepIdx = stepNow?.stepIndex ?? -1;
      const stepEn = stepIdx >= 0 ? session.def.steps[stepIdx].en : '';
      // hand work the nurse performs with her own hands: the wash and PPE, or the task at the bedside
      const startScript = (starter: (p: (r: RunProgress) => void, d: () => void, speed: number) => boolean | undefined): boolean => {
        washKey.current = key;
        const ok = starter(
          (p) => setWash(p),
          () => {
            washKey.current = null;
            setWash(null);
            setWashFast(false);
            complete(key);
          },
          devQuickWash() ? 20 : washFastRef.current ? 3 : 1,
        );
        if (!ok) washKey.current = null;
        return !!ok;
      };
      if (kind === 'hygiene') {
        // the first hygiene step ends with the PPE going on; the last one starts with it coming off
        const ppe = stepIdx === 0 ? 'don' : 'doff';
        if (startScript((p, d, sp) => sim?.startHandWash(p, d, sp, ppe))) return;
        sim?.focusOn(HYGIENE_STATION.x, 1.15, HYGIENE_STATION.z, actionSeconds() + 0.4);
      } else if (kind === 'position' || kind === 'bedside') {
        if (startScript((p, d, sp) => sim?.startBedside(stepEn, p, d, sp))) return;
        if (kind === 'position') sim?.focusOn(0, 0.9, -2.0, actionSeconds() + 0.4);
        else sim?.focusOn(0, 0.95, -1.5, actionSeconds() + 0.4);
      }
      actionTimer.current = window.setTimeout(() => complete(key), actionSeconds() * 1000);
    },
    [busy, result, context, session, explain, touch, complete],
  );

  // What happens when E is pressed on something (kept in a ref so the simulator always calls the latest version)
  const interactRef = useRef<(tgt: InteractableInfo | null) => void>(() => undefined);
  interactRef.current = (tgt) => {
    if (!tgt) {
      showToast(t('hud.aimHint'));
      return;
    }
    if (tgt.id.startsWith('item:')) {
      const id = tgt.id.slice(5);
      const prop = itemsRef.current.get(id);
      if (!prop || !session.pick(id).ok) return;
      simRef.current?.unregisterExtra(prop.root);
      prop.remove();
      simRef.current?.pickGesture();
      showToast(t('proc.picked', { item: prop.label.split(' · ')[lang === 'ar' ? 1 : 0] }));
      bump((n) => n + 1);
    } else if (tgt.id === 'bed-control') {
      bedIdx.current = (bedIdx.current + 1) % BED_ANGLES_DEG.length;
      simRef.current?.setHeadTarget((BED_ANGLES_DEG[bedIdx.current] * Math.PI) / 180);
      setHeadDeg(BED_ANGLES_DEG[bedIdx.current]);
      showToast(t('proc.bed', { deg: BED_ANGLES_DEG[bedIdx.current] }));
    } else if (tgt.id === 'sanitizer') {
      const next = session.nextStep();
      if (practice && next?.kind === 'hygiene') doAction(`s${next.index}`);
      else showToast(t('proc.hands'));
    } else if (tgt.id === 'curtain') {
      const closed = simRef.current?.toggleCurtains();
      showToast(t(closed ? 'toast.curtainClosed' : 'toast.curtainOpened'));
    } else if (tgt.id === 'patient') {
      // Practice: E on the patient does the bedside step that is due. Otherwise (exam, or not a bedside step) open the steps.
      const next = session.nextStep();
      if (practice && next?.kind === 'bedside' && !busy) doAction(`s${next.index}`);
      else openPanel('steps');
    }
  };
  const tooFarRef = useRef<(tgt: InteractableInfo) => void>(() => undefined);
  tooFarRef.current = (tgt) => showToast(t('hud.tooFar', { label: (tgt.label ?? t(tgt.labelKey)).split(' · ')[lang === 'ar' ? 1 : 0] ?? '' }));

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
          else if (washKey.current) {
            // Esc during a hand wash: the wash is cancelled and the step does not count
            washKey.current = null;
            setWash(null);
            setBusy(null);
          }
        },
        onInteract: (tgt) => interactRef.current(tgt),
        onTooFar: (tgt) => tooFarRef.current(tgt),
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
    sim.registerExtra(area.station.root, { id: 'sanitizer', labelKey: '', label: 'Hand-wash sink · حوض غسيل اليدين' }, area.station.setHighlight);
    sim.setHandWashSink(area.station.sink, HYGIENE_STATION.x, HYGIENE_STATION.z);
    sim.registerExtra(area.bedControl, { id: 'bed-control', labelKey: '', label: 'Bed control · مفتاح السرير' }, area.setBedControlHighlight);
    sim.addUpdater(area.updateLabels);
    sim.addUpdater((x, z) =>
      setPose((p) => {
        const nx = Math.round(x * 20) / 20;
        const nz = Math.round(z * 20) / 20;
        const ny = Math.round(sim.playerYaw() * 20) / 20;
        return p.x === nx && p.z === nz && p.yaw === ny ? p : { x: nx, z: nz, yaw: ny };
      }),
    );
    sim.relabel('patient', 'Patient · المريض');
    sim.setAlarmSound(false); // the alarm light shows on the monitor; a siren would only get in the way of practising
    sim.setVentilatorAnchor(area.ventilator?.outlet ?? null);
    if (area.ventilator) {
      const outlet = area.ventilator.outlet;
      sim.addCable(
        () => {
          const a = outlet.getWorldPosition(new THREE.Vector3());
          const b = sim.mouthWorld();
          const mid = a.clone().lerp(b, 0.5);
          mid.y -= 0.35;
          mid.x += 0.1;
          return [a, mid, b];
        },
        0.014,
        0x8fb8d8,
      );
    }
    areaRef.current = area;
    setLayout({ tables: area.tables, rects: area.rects });
    setHowto(!seenHowTo());
    sim.setHeadTarget(0);
    simRef.current = sim;
    sim.start();
    if (import.meta.env.DEV) Object.assign(window, { __sim: sim, __session: session }); // dev-only: lets tests drive the camera
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
    simRef.current?.setRunning(started && !result && !typing && !howto && (locked || panel !== null));
  }, [started, result, locked, panel, typing, howto]);

  // exam clock
  useEffect(() => {
    if (!started || result || mode !== 'exam') return;
    const id = window.setInterval(() => {
      bump((n) => n + 1);
      if (session.timeLeft() === 0) finishRun(true);
    }, 500);
    return () => window.clearInterval(id);
  }, [started, result, mode, session, finishRun]);

  // Practice: Space speeds the hand wash up (the animation still plays, three times faster)
  useEffect(() => {
    if (!wash || !practice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      e.preventDefault();
      washFastRef.current = !washFastRef.current;
      setWashFast(washFastRef.current);
      simRef.current?.setHandsSpeed(washFastRef.current ? 3 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wash, practice]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      simRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  // keys: Q steps, R tray, F map, T coach, B show/hide the dashboard, M sound, E / Esc go back to the room
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTextField(e.target) && e.code !== 'Escape') return;
      if (panel && (e.code === 'KeyE' || e.code === 'Escape')) {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.code === 'KeyM' && !e.repeat) toggleMute();
      if (!started || result || panel || e.repeat) return;
      if (e.code === 'KeyQ') openPanel('steps');
      else if (e.code === 'KeyR') openPanel('tray');
      else if (e.code === 'KeyF') openPanel('map');
      else if (e.code === 'KeyT' && practice) openPanel('coach');
      else if (e.code === 'KeyB') setDashOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, started, result, practice, openPanel, closePanel, toggleMute]);

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

  const objective = practice && layout && started && !result ? currentObjective({ session, player: pose, tables: layout.tables, headDeg }) : null;
  const beaconAt = objective && !objective.arrived ? objective.target : null;
  const beaconKey = beaconAt ? `${beaconAt.x.toFixed(2)},${beaconAt.z.toFixed(2)}` : '';
  useEffect(() => {
    areaRef.current?.setBeacon(beaconKey ? beaconAt : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beaconKey]);
  const arrow = (() => {
    if (!objective?.target) return null;
    const tx = objective.target.x - pose.x;
    const tz = objective.target.z - pose.z;
    const fx = -Math.sin(pose.yaw);
    const fz = -Math.cos(pose.yaw);
    const rx = Math.cos(pose.yaw);
    const rz = -Math.sin(pose.yaw);
    return { rel: Math.atan2(tx * rx + tz * rz, tx * fx + tz * fz), meters: Math.round(Math.hypot(tx, tz)) };
  })();
  const closeHowTo = () => {
    setHowto(false);
    try {
      localStorage.setItem(HOWTO_KEY, '1');
    } catch {
      /* private mode: it will simply show again next time */
    }
  };

  const title = lang === 'ar' ? def.titleAr : def.titleEn;
  const left = session.timeLeft();
  const busyStep = busy ? session.actions.find((a) => a.key === busy) : null;
  const busyDetail = busyStep && practice && busyStep.stepIndex !== null ? def.steps[busyStep.stepIndex] : null;
  const showStart = (!locked && !panel && !result) || error !== null;
  const playing = !error && started && !result;
  const total = def.steps.length;
  const numbers = Object.fromEntries((layout?.tables ?? []).map((tb) => [tb.group, tb.number]));

  const tabs: DashTab[] = [
    { id: 'steps', icon: '☰', label: t('proc.steps'), badge: `${session.doneCount}/${total}` },
    { id: 'map', icon: '🗺', label: t('map.title') },
    { id: 'tray', icon: '🧰', label: t('proc.tray'), badge: practice ? `${session.required.length - session.missing().length}/${session.required.length}` : `${session.trayItems().length}` },
    ...(practice ? [{ id: 'coach', icon: '💬', label: t('proc.coach') }] : []),
  ];

  const objectiveCard = objective && (
    <div className={`objective${objective.arrived ? ' objective--arrived' : ''}`}>
      <div className="objective__arrow" style={arrow && !objective.arrived ? { transform: `rotate(${arrow.rel}rad)` } : undefined} aria-hidden="true">
        {objective.arrived || !arrow ? '✓' : '↑'}
      </div>
      <div className="objective__txt">
        <small>
          {t('guide.now')}
          {arrow && !objective.arrived ? ` · ${t('guide.distance', { m: arrow.meters })}` : ''}
        </small>
        <b>{lang === 'ar' ? objective.ar : objective.en}</b>
      </div>
    </div>
  );

  return (
    <div className="app" onContextMenu={(e) => e.preventDefault()}>
      <div className={`stage${touch ? ' stage--touch' : ''}`}>
        <div className="viewport" ref={viewportRef} />

        {playing && (
          <>
            <Hud target={target} panelOpen={panel !== null || wash !== null} quiet={busy !== null || wash !== null} touch={touch} />
            {wash && (
              <HandWashCard
                progress={wash}
                fast={washFast}
                canSpeedUp={practice}
                touch={touch}
                onFaster={() => {
                  washFastRef.current = !washFastRef.current;
                  setWashFast(washFastRef.current);
                  simRef.current?.setHandsSpeed(washFastRef.current ? 3 : 1);
                }}
              />
            )}
            <div className="stage__notes" dir={dir} aria-live="polite">
              {busy && (
                <div className="proc-busy" role="status">
                  <b>{busyDetail ? shortTitle(lang === 'ar' ? busyDetail.ar : busyDetail.en, 80) : t('proc.doing')}</b>
                  {busyDetail && lang === 'ar' && <small>{busyDetail.doing}</small>}
                  <div className="proc-bar"><i style={{ animationDuration: `${actionSeconds()}s` }} /></div>
                </div>
              )}
              {toast && (
                <div className="toast" role="status">
                  {toast}
                </div>
              )}
            </div>
            {!dashOpen && !touch && (
              <button type="button" className="stage__dashbtn" onClick={() => setDashOpen(true)}>
                ☰ {session.doneCount}/{total}
              </button>
            )}
          </>
        )}

        {playing && touch && locked && (
          <TouchControls
            canInteract={target !== null && !target.far}
            onMove={(x, y) => simRef.current?.setMoveInput(x, y)}
            onLook={(dx, dy) => simRef.current?.look(dx, dy)}
            onTap={(x, y) => simRef.current?.tapAt(x, y)}
            onInteract={() => simRef.current?.interact()}
            onPause={() => simRef.current?.stopTouch()}
            muted={muted}
            onToggleMute={toggleMute}
            dashOpen={dashOpen}
            onToggleDash={() => setDashOpen((o) => !o)}
            onSettings={() => {
              simRef.current?.stopTouch();
              openSettings();
            }}
          />
        )}

        {howto && playing && <HowToCard touch={touch} mode={mode} onClose={closeHowTo} />}
      </div>

      {playing && dashOpen && (
        <Dashboard
          title={title}
          tag={{ text: t(`menu.mode.${mode}`), tone: mode }}
          progress={{ value: total === 0 ? 0 : session.doneCount / total, text: t('proc.done', { n: session.doneCount, total }) }}
          timer={left !== null ? { text: mmss(left), low: left < 60 } : undefined}
          objective={objectiveCard}
          tabs={tabs}
          active={tab}
          onTab={(id) => selectTab(id as TabId)}
          focused={panel !== null}
          hint={touch ? undefined : t(panel ? 'dash.hint.focus' : `dash.hint.${mode}`)}
          onCollapse={() => setDashOpen(false)}
        >
          {tab === 'steps' && <StepsTab session={session} busy={busy !== null} onDo={doAction} onFinish={confirmFinish} />}
          {tab === 'map' && layout && (
            <div className="mapwrap">
              <MiniMap rects={layout.rects} player={pose} target={beaconAt} />
              <ul className="legend">
                <li><i className="dot dot--you" /> {t('map.you')}</li>
                <li><i className="dot dot--table" /> {t('map.tables')}</li>
                <li><i className="dot dot--sink" /> {t('map.sanitizer')}</li>
                <li><i className="dot dot--bed" /> {t('map.bedControl')}</li>
              </ul>
            </div>
          )}
          {tab === 'tray' && <TrayTab session={session} numbers={numbers} />}
          {tab === 'coach' && practice && (
            <PatientChat peer="coach" turns={turns} onTurns={setTurns} ask={async (q, h) => ({ text: await askCoach(coachState(), q, h) })} onTypingChange={setTyping} />
          )}
        </Dashboard>
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
