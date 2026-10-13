import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventLog, type SimEvent } from './core/EventLog';
import { PatientModel } from './domain/patient/PatientModel';
import { GLUCOSE_TREATMENTS, glucoseStatus, type GlucoseTreatment } from './domain/physiology/glucose';
import { medById, type MedId } from './domain/medications';
import { ASSESSMENT_EVENTS } from './domain/scoring/common';
import { buildSbar, type SbarDraft, type SbarOption } from './domain/scenarios/sbar';
import { FLUIDS, type IvInfusion, type OxygenSetup } from './domain/physiology';
import { OXYGEN_DEVICES } from './domain/physiology/oxygen';
import { SCENARIOS, ScenarioSession, type Scenario, type ScenarioId } from './domain/scenarios';
import { Simulator, type AlarmState, type InteractableInfo } from './game/Simulator';
import { getLang, hasKey, t, useLang } from './i18n';
import { doctorChat, doctorService, patientConversation, SMALL_TALK, type ChatTurn } from './services/ai';
import ChatPanel from './ui/ChatPanel';
import Dashboard, { type DashTab } from './ui/Dashboard';
import Hud from './ui/Hud';
import IvPanel from './ui/IvPanel';
import Menu from './ui/Menu';
import ProcedureSimulation from './ProcedureSimulation';
import { getProcedure } from './domain/procedures/catalog';
import type { Mode, ProcedureId } from './domain/procedures/types';
import MedsPanel from './ui/MedsPanel';
import OxygenPanel from './ui/OxygenPanel';
import PatientPanel, { type PatientActions } from './ui/PatientPanel';
import ResultsScreen from './ui/ResultsScreen';
import StartOverlay from './ui/StartOverlay';
import TouchControls from './ui/TouchControls';
import VitalsPanel from './ui/VitalsPanel';

type PanelId = 'vitals' | 'oxygen' | 'patient' | 'iv' | 'meds' | 'chat';
type TabId = 'case' | 'chat';
const PANEL_FOR: Record<string, PanelId> = { 'patient-monitor': 'vitals', 'oxygen-device': 'oxygen', patient: 'patient', 'iv-stand': 'iv', 'med-cart': 'meds' };

/** Phones/tablets: no keyboard or pointer lock, so we show a joystick instead. */
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

const isTextField = (el: EventTarget | null) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

export default function App() {
  useLang(); // re-render everything when the language changes
  const [choice, setChoice] = useState<
    { kind: 'case'; id: ScenarioId; run: number } | { kind: 'procedure'; id: ProcedureId; mode: Mode; run: number } | null
  >(null);

  if (!choice)
    return (
      <Menu
        onPick={(id) => setChoice({ kind: 'case', id, run: 1 })}
        onPickProcedure={(id, mode) => setChoice({ kind: 'procedure', id, mode, run: 1 })}
      />
    );
  if (choice.kind === 'procedure') {
    return (
      <ProcedureSimulation
        key={`${choice.id}-${choice.mode}-${choice.run}`}
        def={getProcedure(choice.id)}
        mode={choice.mode}
        onRestart={() => setChoice({ ...choice, run: choice.run + 1 })}
        onMenu={() => setChoice(null)}
      />
    );
  }
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
  const hygieneWarned = useRef(false);
  const toastTimer = useRef<number>(0);

  const touch = useMemo(isTouchDevice, []);
  const patient = useMemo(() => new PatientModel(scenario.patient, scenario.initialVitals, scenario.createEngine()), [scenario]);
  const log = useMemo(() => new EventLog(() => patient.getSimTime()), [patient]);
  const session = useMemo(() => new ScenarioSession(scenario, patient, log), [scenario, patient, log]);

  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [target, setTarget] = useState<InteractableInfo | null>(null);
  /** Desktop: non-null while the mouse is free to click in the dashboard. Phone: an object panel (monitor, oxygen...) is open. */
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [tab, setTab] = useState<TabId>('case');
  const [dashOpen, setDashOpen] = useState(true);
  const [alarm, setAlarm] = useState<AlarmState>({ active: false, silenced: false, codes: [], message: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState<SimEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [doctorTurns, setDoctorTurns] = useState<ChatTurn[]>([]);
  const [orders, setOrders] = useState<MedId[]>([]);
  const [given, setGiven] = useState<MedId[]>([]);
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
      setDashOpen(true);
      if (id === 'chat') {
        setTab('chat');
        if (touch) return; // on a phone the chat is just a dashboard tab: the controls stay on
      }
      simRef.current?.releaseCursor();
      setPanel(id);
    },
    [log, patient, touch],
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
        onTooFar: (tgt) => showToast(t('hud.tooFar', { label: tgt.label ?? t(tgt.labelKey) })),
        onInteract: (tgt) => {
          if (!tgt) {
            showToast(t('hud.aimHint'));
            return;
          }
          if (tgt?.id === 'sanitizer') {
            log.record('hand-hygiene');
            showToast(t('toast.hygiene'));
            return;
          }
          if (tgt?.id === 'curtain') {
            const closed = sim.toggleCurtains();
            log.record(closed ? 'curtain-closed' : 'curtain-opened');
            showToast(t(closed ? 'toast.curtainClosed' : 'toast.curtainOpened'));
            return;
          }
          const id = tgt ? PANEL_FOR[tgt.id] : undefined;
          if (id) openPanel(id);
        },
        onTick: (dt) => session.update(dt),
        onAlarmChange: setAlarm,
      }, { glucometer: scenario.tools?.glucometer === true });
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

    if (import.meta.env.DEV) (window as unknown as { __sim?: Simulator }).__sim = sim; // dev-only: lets tests drive the camera
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
      if (e.code === 'KeyT' && !e.repeat && !isTextField(e.target) && started && !ended && !panel) {
        e.preventDefault();
        openPanel('chat');
      }
      if (e.code === 'KeyB' && !e.repeat && !isTextField(e.target) && started && !ended && !panel) setDashOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMute, started, ended, panel, openPanel]);

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

  /** Touching the patient without having cleaned the hands first: one gentle reminder, and it is noted in the debrief. */
  const hygieneCheck = () => {
    if (hygieneWarned.current || log.all().some((e) => e.type === 'hand-hygiene')) return;
    hygieneWarned.current = true;
    log.record('hygiene-missed');
    showToast(t('toast.hygieneMissed'));
  };

  const actions: PatientActions = {
    ask() {
      hygieneCheck();
      log.record('patient-asked');
      return scenario.findings.ask(patient.getVitals(), { glucose: patient.getGlucose() });
    },
    skin() {
      hygieneCheck();
      log.record('skin-checked');
      return scenario.findings.skin(patient.getVitals(), { glucose: patient.getGlucose() });
    },
    heart() {
      hygieneCheck();
      log.record('heart-auscultated');
      simRef.current?.listenHeart();
      return scenario.findings.heart(patient.getVitals());
    },
    lungs() {
      hygieneCheck();
      const f = scenario.findings.lungs(patient.getVitals());
      log.record('lungs-auscultated');
      simRef.current?.listenLungs(f.crackles);
      return f.text;
    },
    temp() {
      hygieneCheck();
      log.record('temp-measured');
      return t('msg.temp', { temp: patient.getVitals().temperatureC.toFixed(1) });
    },
    bp() {
      hygieneCheck();
      simRef.current?.pulseCuff(6);
      log.record('bp-measured', { sys: sys(), dia: dia() });
      return t('msg.bp', { sys: sys(), dia: dia() });
    },
    ivSite() {
      hygieneCheck();
      log.record('iv-checked');
      return t('msg.ivSite');
    },
    sbarDraft() {
      return buildSbar(scenario, patient, log.all());
    },
    async sendSbar(option: SbarOption, draft: SbarDraft) {
      log.record('sbar-sent', { rec: option.id, quality: option.quality });
      const iv = patient.getInterventions();
      const stabilised = session.isStabilised;
      session.notifyDoctor();
      const scripted = scenario.doctorReply({
        stabilised,
        oxygenOn: iv.oxygen !== null,
        ivOn: patient.isIvRunning(),
        glucoseTreated: log.all().some((e) => e.type === 'glucose-given'),
      });
      // With the AI backend the doctor answers this exact report; otherwise (or on failure) the scripted reply is used
      const ai = await doctorService.reply({ scenario, draft, option, stabilised, lang: getLang() });
      return ai ? `${t('doc.prefix')} "${ai}"` : scripted;
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
      hygieneCheck();
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

  // ---- doctor chat + medications ----
  const askDoctorChat = async (question: string, history: readonly ChatTurn[]) => {
    const iv = patient.getInterventions();
    const reply = await doctorChat.ask(
      {
        scenario,
        vitals: patient.getVitals(),
        glucose: patient.getGlucose(),
        lang: getLang(),
        assessed: log.all().some((e) => ASSESSMENT_EVENTS.includes(e.type)),
        oxygenOn: iv.oxygen !== null,
        ivOn: patient.isIvRunning(),
        glucoseTreated: log.all().some((e) => e.type === 'glucose-given'),
      },
      question,
      history,
    );
    if (!log.all().some((e) => e.type === 'doctor-chat')) log.record('doctor-chat');
    if (reply.order) {
      const { medId, approved } = reply.order;
      if (!log.all().some((e) => e.type === (approved ? 'med-ordered' : 'med-declined') && e.data?.med === medId)) {
        log.record(approved ? 'med-ordered' : 'med-declined', { med: medId });
      }
      if (approved) setOrders((o) => (o.includes(medId) ? o : [...o, medId]));
    }
    return reply;
  };

  /** Ask for an order from the medication cart: the exchange also appears in the doctor chat. */
  const requestMed = async (id: MedId) => {
    const question = t('dchat.askMed', { med: t(medById(id).nameKey) });
    const reply = await askDoctorChat(question, doctorTurns);
    setDoctorTurns((prev) => [...prev, { from: 'nurse', text: question }, { from: 'doctor', text: reply.text }]);
    return `${t('doc.prefix')} \"${reply.text}\"`;
  };

  const giveMed = (id: MedId) => {
    if (!orders.includes(id)) {
      log.record('med-blocked', { med: id });
      return t('meds.noOrder');
    }
    const med = medById(id);
    patient.giveMedication(id);
    setGiven((g) => (g.includes(id) ? g : [...g, id]));
    log.record('med-given', { med: id });
    const extra = hasKey(`msg.med.${id}`) ? ` ${t(`msg.med.${id}`)}` : '';
    return t('msg.med.given', { med: t(med.nameKey), dose: t(med.doseKey) }) + extra;
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
  const playing = !error && started && !ended;
  const objectPanel = panel !== null && panel !== 'chat';

  const tabs: DashTab[] = [
    { id: 'case', icon: '📋', label: t('dash.case') },
    { id: 'chat', icon: '💬', label: t('hud.chat') },
  ];

  const renderObjectPanel = () => {
    switch (panel) {
      case 'vitals':
        return <VitalsPanel patient={patient} alarm={alarm} touch={touch} onSilence={silenceAlarm} onClose={closePanel} />;
      case 'oxygen':
        return <OxygenPanel current={patient.getInterventions().oxygen} touch={touch} onApply={applyOxygen} onRemove={removeOxygen} onClose={closePanel} />;
      case 'iv':
        return <IvPanel patient={patient} touch={touch} onStart={startIv} onStop={stopIv} onNewBag={newBag} onClose={closePanel} />;
      case 'meds':
        return (
          <MedsPanel touch={touch} ordered={orders} given={given} glucoseHint={scenario.tools?.glucometer === true} onAsk={requestMed} onGive={giveMed} onClose={closePanel} />
        );
      case 'patient':
        return (
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="app" onContextMenu={(e) => e.preventDefault()}>
      <div className={`stage${touch ? ' stage--touch' : ''}`}>
        <div className="viewport" ref={viewportRef} />

        {playing && (
          <>
            <Hud target={target} panelOpen={panel !== null} />
            {toast && (
              <div className="stage__notes">
                <div className="toast" role="status">
                  {toast}
                </div>
              </div>
            )}
            {!dashOpen && !touch && (
              <button type="button" className="stage__dashbtn" onClick={() => setDashOpen(true)}>
                ☰
              </button>
            )}
          </>
        )}

        {playing && touch && locked && !objectPanel && (
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
          />
        )}
      </div>

      {playing && dashOpen && (
        <Dashboard
          title={t(scenario.titleKey)}
          objective={
            <div className="objective objective--plain">
              <div className="objective__txt">
                <small>{t('guide.now')}</small>
                <b>{session.objective}</b>
              </div>
            </div>
          }
          tabs={objectPanel ? undefined : tabs}
          active={tab}
          onTab={(id) => {
            setTab(id as TabId);
            if (!touch && panel) setPanel(id === 'chat' ? 'chat' : null);
          }}
          focused={panel !== null}
          hint={touch ? undefined : t(panel ? 'dash.hint.focus' : 'dash.hint.case')}
          onCollapse={() => setDashOpen(false)}
        >
          {objectPanel ? (
            renderObjectPanel()
          ) : tab === 'chat' ? (
            <ChatPanel
              patientTurns={turns}
              doctorTurns={doctorTurns}
              onPatientTurns={setTurns}
              onDoctorTurns={setDoctorTurns}
              askPatient={actions.askPatient}
              askDoctor={askDoctorChat}
              onTypingChange={setTyping}
            />
          ) : (
            <div className="casetab">
              <p>{t(scenario.introKey)}</p>
              <ul className="casetab__tips">
                <li>🩺 {t('dash.case.tip1')}</li>
                <li>🖥 {t('dash.case.tip2')}</li>
                <li>💬 {t('dash.case.tip3')}</li>
              </ul>
              <div className="dash__actions">
                <button type="button" className="btn" onClick={() => session.finish()}>
                  {t('start.finish')}
                </button>
              </div>
            </div>
          )}
        </Dashboard>
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
