import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventLog, type SimEvent } from './core/EventLog';
import { PatientModel } from './domain/patient/PatientModel';
import { GLUCOSE_TREATMENTS, glucoseStatus, type GlucoseTreatment } from './domain/physiology/glucose';
import { buildSbar, type SbarOption } from './domain/scenarios/sbar';
import { FLUIDS, type IvInfusion, type OxygenSetup } from './domain/physiology';
import { OXYGEN_DEVICES } from './domain/physiology/oxygen';
import { SCENARIOS, ScenarioSession, type Scenario, type ScenarioId } from './domain/scenarios';
import { Simulator, type AlarmState, type InteractableInfo } from './game/Simulator';
import { getLang, t, useLang } from './i18n';
import { patientConversation, SMALL_TALK, type ChatTurn } from './services/ai';
import Hud from './ui/Hud';
import IvPanel from './ui/IvPanel';
import Menu from './ui/Menu';
import OxygenPanel from './ui/OxygenPanel';
import PatientPanel, { type PatientActions } from './ui/PatientPanel';
import ResultsScreen from './ui/ResultsScreen';
import StartOverlay from './ui/StartOverlay';
import TouchControls from './ui/TouchControls';
import VitalsPanel from './ui/VitalsPanel';

type PanelId = 'vitals' | 'oxygen' | 'patient' | 'iv';
const PANEL_FOR: Record<string, PanelId> = { 'patient-monitor': 'vitals', 'oxygen-device': 'oxygen', patient: 'patient', 'iv-stand': 'iv' };

/** Phones/tablets: no keyboard or pointer lock, so we show a joystick instead. */
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

const isTextField = (el: EventTarget | null) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

export default function App() {
  useLang(); // re-render everything when the language changes
  const [choice, setChoice] = useState<{ id: ScenarioId; run: number } | null>(null);

  if (!choice) return <Menu onPick={(id) => setChoice({ id, run: 1 })} />;
  return (
    <Simulation
      key={`${choice.id}-${choice.run}`}
      scenario={SCENARIOS[choice.id]}
      onRestart={() => setChoice({ ...choice, run: choice.run + 1 })}
      onMenu={() => setChoice(null)}
    />
  );
}

function Simulation({ scenario, onRestart, onMenu }: { scenario: Scenario; onRestart: () => void; onMenu: () => void }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulator | null>(null);
  const toastTimer = useRef<number>(0);

  const touch = useMemo(isTouchDevice, []);
  const patient = useMemo(() => new PatientModel(scenario.patient, scenario.initialVitals, scenario.createEngine()), [scenario]);
  const log = useMemo(() => new EventLog(() => patient.getSimTime()), [patient]);
  const session = useMemo(() => new ScenarioSession(scenario, patient, log), [scenario, patient, log]);

  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [target, setTarget] = useState<InteractableInfo | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [alarm, setAlarm] = useState<AlarmState>({ active: false, silenced: false, codes: [], message: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState<SimEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [typing, setTyping] = useState(false);
  const [, bump] = useState(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const openPanel = useCallback(
    (id: PanelId) => {
      if (id === 'vitals') {
        const v = patient.getVitals();
        log.record('monitor-checked', { spo2: v.spo2, hr: v.heartRate, rr: v.respiratoryRate });
      }
      simRef.current?.releaseCursor();
      setPanel(id);
    },
    [log, patient],
  );

  const closePanel = useCallback(() => {
    setPanel(null);
    if (!touch) simRef.current?.lock();
  }, [touch]);

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
          if (isLocked) {
            setStarted(true);
            session.start();
          }
        },
        onInteract: (tgt) => {
          const id = tgt ? PANEL_FOR[tgt.id] : undefined;
          if (id) openPanel(id);
        },
        onTick: (dt) => session.update(dt),
        onAlarmChange: setAlarm,
      });
    } catch (e) {
      console.error(e);
      setError('error.webgl');
      return;
    }

    session.onChange = () => {
      bump((n) => n + 1);
      if (session.status === 'completed') {
        setEnded([...log.all()]);
        setPanel(null);
        sim.releaseCursor();
      }
    };
    patient.onBagEmpty = () => showToast(t('toast.bagEmpty'));

    simRef.current = sim;
    sim.start();
    return () => {
      session.onChange = undefined;
      patient.onBagEmpty = undefined;
      sim.dispose();
      simRef.current = null;
    };
  }, [patient, session, log, openPanel, showToast]);

  // Time only runs while the student is in the simulation (or has a panel open)
  useEffect(() => {
    simRef.current?.setRunning(started && !ended && !typing && (locked || panel !== null));
  }, [started, ended, locked, panel, typing]);

  // Desktop: E or Esc closes the open panel
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && isTextField(e.target)) return; // typing the letter "e" in the chat box
      if (e.code === 'KeyE' || e.code === 'Escape') {
        e.preventDefault();
        closePanel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, closePanel]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      simRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.repeat && !isTextField(e.target)) toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMute]);

  // ---- nursing actions ----
  const sys = () => patient.getVitals().systolic;
  const dia = () => patient.getVitals().diastolic;

  const applyOxygen = (setup: OxygenSetup) => {
    const had = patient.getInterventions().oxygen !== null;
    patient.applyOxygen(setup);
    log.record(had ? 'oxygen-changed' : 'oxygen-applied', { device: setup.device, flowLpm: setup.flowLpm, spo2: patient.getVitals().spo2 });
    showToast(t('toast.o2on', { device: t(OXYGEN_DEVICES[setup.device].labelKey), flow: setup.flowLpm }));
    closePanel();
  };

  const removeOxygen = () => {
    patient.removeOxygen();
    log.record('oxygen-removed');
    showToast(t('toast.o2off'));
    closePanel();
  };

  const startIv = (infusion: IvInfusion) => {
    const had = patient.getInterventions().iv !== null;
    patient.startIv(infusion);
    log.record(had ? 'iv-changed' : 'iv-started', { fluid: infusion.fluid, rateMlHr: infusion.rateMlHr, sys: sys(), dia: dia() });
    showToast(t('toast.ivOn', { fluid: t(FLUIDS[infusion.fluid].labelKey), rate: infusion.rateMlHr }));
    closePanel();
  };

  const stopIv = () => {
    patient.stopIv();
    log.record('iv-stopped');
    showToast(t('toast.ivOff'));
    closePanel();
  };

  const newBag = () => {
    patient.hangNewBag();
    log.record('iv-bag-changed');
    showToast(t('toast.newBag'));
  };

  const silenceAlarm = () => {
    simRef.current?.silenceAlarm(60);
    log.record('alarm-silenced');
    showToast(t('toast.alarm'));
  };

  const actions: PatientActions = {
    ask() {
      log.record('patient-asked');
      return scenario.findings.ask(patient.getVitals(), { glucose: patient.getGlucose() });
    },
    skin() {
      log.record('skin-checked');
      return scenario.findings.skin(patient.getVitals(), { glucose: patient.getGlucose() });
    },
    heart() {
      log.record('heart-auscultated');
      simRef.current?.listenHeart();
      return scenario.findings.heart(patient.getVitals());
    },
    lungs() {
      const f = scenario.findings.lungs(patient.getVitals());
      log.record('lungs-auscultated');
      simRef.current?.listenLungs(f.crackles);
      return f.text;
    },
    temp() {
      log.record('temp-measured');
      return t('msg.temp', { temp: patient.getVitals().temperatureC.toFixed(1) });
    },
    bp() {
      simRef.current?.pulseCuff(6);
      log.record('bp-measured', { sys: sys(), dia: dia() });
      return t('msg.bp', { sys: sys(), dia: dia() });
    },
    ivSite() {
      log.record('iv-checked');
      return t('msg.ivSite');
    },
    sbarDraft() {
      return buildSbar(scenario, patient, log.all());
    },
    sendSbar(option: SbarOption) {
      log.record('sbar-sent', { rec: option.id, quality: option.quality });
      const iv = patient.getInterventions();
      session.notifyDoctor();
      return scenario.doctorReply({
        stabilised: session.isStabilised,
        oxygenOn: iv.oxygen !== null,
        ivOn: patient.isIvRunning(),
        glucoseTreated: log.all().some((e) => e.type === 'glucose-given'),
      });
    },
    checkGlucose() {
      const g = patient.getGlucose() ?? 0;
      log.record('glucose-checked', { glucose: g });
      return t('msg.glucose', { g, status: t(`glu.status.${glucoseStatus(g)}`) });
    },
    giveGlucose(kind: GlucoseTreatment) {
      patient.giveGlucoseTreatment(kind);
      log.record('glucose-given', { kind });
      return t(`msg.glucose.${kind}`, { treatment: t(GLUCOSE_TREATMENTS[kind].labelKey) });
    },
    async askPatient(question: string, history: readonly ChatTurn[]) {
      const reply = await patientConversation.ask(
        { scenario, vitals: patient.getVitals(), glucose: patient.getGlucose(), lang: getLang() },
        question,
        history,
      );
      // small talk and "I did not understand" are not history taking
      const topics = reply.intents.filter((i) => !SMALL_TALK.includes(i));
      if (topics.length > 0) log.record('history-asked', { intents: reply.intents });
      return reply;
    },
    toggleHead() {
      const on = !patient.getInterventions().headElevated;
      patient.setHeadElevated(on);
      log.record(on ? 'head-raised' : 'head-lowered');
      return { on, message: t(on ? 'msg.headUp' : 'msg.headDown') };
    },
    toggleLegs() {
      const on = !patient.getInterventions().legsRaised;
      patient.setLegsRaised(on);
      log.record(on ? 'legs-raised' : 'legs-lowered');
      return { on, message: t(on ? 'msg.legsUp' : 'msg.legsDown') };
    },
  };

  // ---- start / resume ----
  const start = () => {
    const sim = simRef.current;
    if (!sim) return;
    sim.startAudio();
    if (touch) {
      // Fullscreen + landscape where the browser allows it (Android Chrome); silently ignored elsewhere
      document.documentElement.requestFullscreen?.().catch(() => undefined);
      (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')?.catch(() => undefined);
      sim.startTouch();
    } else {
      sim.lock();
    }
  };

  const showStart = (!locked && !panel && !ended) || error !== null;

  return (
    <div className="app" onContextMenu={(e) => e.preventDefault()}>
      <div className="viewport" ref={viewportRef} />

      {!error && started && !ended && (
        <Hud title={t(scenario.titleKey)} objective={session.objective} target={target} touch={touch} panelOpen={panel !== null} muted={muted} />
      )}

      {!error && touch && locked && !panel && !ended && (
        <TouchControls
          canInteract={target !== null}
          onMove={(x, y) => simRef.current?.setMoveInput(x, y)}
          onLook={(dx, dy) => simRef.current?.look(dx, dy)}
          onInteract={() => simRef.current?.interact()}
          onPause={() => simRef.current?.stopTouch()}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {panel === 'vitals' && <VitalsPanel patient={patient} alarm={alarm} touch={touch} onSilence={silenceAlarm} onClose={closePanel} />}
      {panel === 'oxygen' && (
        <OxygenPanel current={patient.getInterventions().oxygen} touch={touch} onApply={applyOxygen} onRemove={removeOxygen} onClose={closePanel} />
      )}
      {panel === 'iv' && <IvPanel patient={patient} touch={touch} onStart={startIv} onStop={stopIv} onNewBag={newBag} onClose={closePanel} />}
      {panel === 'patient' && (
        <PatientPanel
          patient={patient}
          touch={touch}
          hasGlucometer={scenario.tools?.glucometer === true}
          actions={actions}
          turns={turns}
          onTurns={setTurns}
          onTypingChange={setTyping}
          onClose={closePanel}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {showStart && (
        <StartOverlay
          introKey={scenario.introKey}
          started={started}
          error={error ? t(error) : null}
          touch={touch}
          onStart={start}
          onFinish={() => session.finish()}
          onBack={onMenu}
        />
      )}
      {ended && <ResultsScreen scenario={scenario} events={ended} onRestart={onRestart} onMenu={onMenu} />}
    </div>
  );
}
