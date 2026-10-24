import * as THREE from 'three';
import { Hands } from './hands/Hands';
import { HandWashRun, type WashProgress } from './hands/HandWashRun';
import type { HandWashSink } from './world/HandWashSink';
import { ALERT_TEXT_EN, criticalAlerts, type AlertCode } from '../domain/patient/alarms';
import type { PatientModel } from '../domain/patient/PatientModel';
import { BAG_ML } from '../domain/physiology/fluids';
import type { Interventions } from '../domain/physiology/interventions';
import { AudioEngine } from './audio/AudioEngine';
import { FirstPersonController } from './controls/FirstPersonController';
import { InteractionSystem, type InteractableInfo } from './interaction/InteractionSystem';
import { BED_POS, INTERACT_DISTANCE, MONITOR_POS, OXYGEN_POS, PATIENT_REACH, type Rect } from './layout';
import { buildClinicalScene, type ClinicalScene } from './world/ClinicalScene';
import { disposeScene } from './world/helpers';

export type { InteractableInfo };

export interface AlarmState {
  active: boolean;
  silenced: boolean;
  codes: AlertCode[];
  message: string; // English text for the 3D monitor screen
}

export interface SimulatorCallbacks {
  onTargetChange(target: InteractableInfo | null): void;
  /** E pressed (or the touch button, or a tap on the object). `target` is what the player is looking at (null if nothing). */
  onInteract(target: InteractableInfo | null): void;
  /** The player tried to use something that is in view but too far away. */
  onTooFar?(target: InteractableInfo): void;
  onLockChange(locked: boolean): void;
  /** Called every frame with the simulated seconds that passed (0 while paused). */
  onTick(simDt: number): void;
  onAlarmChange(alarm: AlarmState): void;
}

const HEAD_RAISED = 1.0; // radians (~57°), high Fowler's
const LEGS_RAISED = 0.5; // radians (~29°)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Owns the Three.js renderer, the render loop, the player and the audio. React only talks to this class. */
export class Simulator {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private world: ClinicalScene;
  private controller: FirstPersonController;
  private interaction: InteractionSystem;
  private audio = new AudioEngine();
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver;
  /** The nurse's own hands, drawn over the room while she does something with them. */
  readonly hands = new Hands();
  private wash: HandWashRun | null = null;
  private sink: { unit: HandWashSink; x: number; z: number } | null = null;

  private running = false;
  private headAngle = 0;
  private headOverride: number | null = null;
  private updaters: ((x: number, z: number) => void)[] = [];
  private focusAt: THREE.Vector3 | null = null;
  private focusUntil = 0;
  private alarmSound = true;
  private updaterClock = 0;
  private basePixelRatio = 1;
  private quality = 1;
  private perfTime = 0;
  private perfFrames = 0;
  private legAngle = 0;
  private lastVitals: ReturnType<PatientModel['getVitals']> | null = null;
  private lastInterventions: Interventions | null = null;
  private alarm: AlarmState = { active: false, silenced: false, codes: [], message: '' };
  private silencedUntil = 0;

  constructor(private container: HTMLElement, private patient: PatientModel, private callbacks: SimulatorCallbacks, options: { glucometer?: boolean } = {}) {
    const dpr = window.devicePixelRatio || 1;
    this.renderer = new THREE.WebGLRenderer({ antialias: dpr <= 1 });
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.basePixelRatio = Math.min(dpr, coarse ? 1.25 : 1.5); // lighter on phones
    this.renderer.setPixelRatio(this.basePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 30);
    this.world = buildClinicalScene(patient.profile, options);

    this.controller = new FirstPersonController(this.camera, this.renderer.domElement, this.world.colliders, this.world.bounds, {
      onLockChange: (locked) => {
        if (!locked) {
          this.interaction.clear();
          this.cancelHandWash();
        }
        callbacks.onLockChange(locked);
      },
    });

    this.interaction = new InteractionSystem(this.camera, this.world.scene, INTERACT_DISTANCE, callbacks.onTargetChange);
    this.interaction.register(
      this.world.monitor.group,
      { id: 'patient-monitor', labelKey: 'obj.monitor' },
      (on) => this.world.monitor.setHighlight(on),
    );
    this.interaction.register(
      this.world.oxygen.group,
      { id: 'oxygen-device', labelKey: 'obj.oxygen' },
      (on) => this.world.oxygen.setHighlight(on),
    );
    this.interaction.register(
      this.world.iv.group,
      { id: 'iv-stand', labelKey: 'obj.iv' },
      (on) => this.world.iv.setHighlight(on),
    );
    this.interaction.register(
      this.world.medCart.group,
      { id: 'med-cart', labelKey: 'obj.medcart' },
      (on) => this.world.medCart.setHighlight(on),
    );
    const sanitizer = this.world.sanitizer;
    if (sanitizer) this.interaction.register(sanitizer.root, { id: 'sanitizer', labelKey: 'obj.sanitizer' }, (on) => sanitizer.setHighlight(on));
    for (const root of this.world.curtains.pickRoots) {
      this.interaction.register(root, { id: 'curtain', labelKey: 'obj.curtain' }, (on) => this.world.curtains.setHighlight(on));
    }
    this.interaction.register(this.world.patient.group, { id: 'patient', labelKey: 'obj.patient' }, undefined, PATIENT_REACH);
    this.interaction.register(this.world.bed.group, { id: 'patient', labelKey: 'obj.patient' }, undefined, PATIENT_REACH);

    this.world.monitor.display.onBeat = () => {
      if (this.running) this.audio.beep(this.patient.getVitals().spo2, this.distanceGain(MONITOR_POS, 6));
    };

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    window.addEventListener('keydown', this.onKeyDown);
  }

  start(): void {
    this.clock.start();
    this.renderer.setAnimationLoop(this.tick);
  }

  /** Simulated time only advances while running (not on the start screen, pause or results). */
  setRunning(running: boolean): void {
    this.running = running;
  }

  /** Desktop: capture the mouse. */
  lock(): void {
    this.controller.lock();
  }

  /** Give the cursor back (panel open). */
  releaseCursor(): void {
    this.controller.releaseCursor();
  }

  /** Touch devices: start/stop receiving input (no pointer lock on phones). */
  startTouch(): void {
    this.controller.setActive(true);
  }

  stopTouch(): void {
    this.controller.setActive(false);
  }

  setMoveInput(x: number, y: number): void {
    this.controller.setTouchMove(x, y);
  }

  look(dx: number, dy: number): void {
    this.controller.addLook(dx, dy);
  }

  // ---- hand washing at the sink (procedure mode) ----

  /** Tell the simulator where the hand-wash sink stands (room position of its origin). */
  setHandWashSink(unit: HandWashSink, x: number, z: number): void {
    this.sink = { unit, x, z };
  }

  /**
   * Walk to the sink and wash the hands with the WHO technique. `onDone` is called when the wash is complete;
   * a cancelled wash (Esc) never calls it. Returns false when the room has no sink.
   */
  startHandWash(onProgress: (p: WashProgress) => void, onDone: () => void, speed = 1): boolean {
    if (!this.sink || this.wash?.active) return false;
    const { unit, x, z } = this.sink;
    const a = unit.anchors;
    const at = (v: THREE.Vector3) => new THREE.Vector3(x + v.x, v.y, z + v.z);
    this.wash = new HandWashRun(
      {
        hands: this.hands,
        camera: this.camera,
        driveTo: (px, pz, k) => this.controller.driveTo(px, pz, k),
        lookAt: (lx, ly, lz, k) => this.controller.lookToward(lx, ly, lz, k),
        distanceTo: (px, pz) => this.controller.distanceTo(px, pz),
        setScripted: (on) => {
          this.controller.scripted = on;
        },
        setWater: (on) => unit.setWater(on),
        stand: new THREE.Vector3(x, 0, z + a.standZ),
        basin: at(a.basin),
        anchorsWorld: { tap: at(a.tap), soap: at(a.soap), towel: at(a.towel) },
      },
      onProgress,
      onDone,
    );
    this.wash.speed = speed;
    this.interaction.clear();
    return true;
  }

  setHandWashSpeed(speed: number): void {
    if (this.wash) this.wash.speed = speed;
  }

  cancelHandWash(): void {
    this.wash?.cancel();
    this.wash = null;
  }

  get washing(): boolean {
    return this.wash?.active === true;
  }

  /** Same as pressing E. */
  interact(): void {
    if (!this.controller.locked || this.wash?.active) return;
    this.use(this.interaction.target);
  }

  /** Touch: a tap on the 3D view uses what is under the finger. Returns true when the tap landed on something usable. */
  tapAt(clientX: number, clientY: number): boolean {
    if (!this.controller.locked) return false;
    const r = this.renderer.domElement.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((clientY - r.top) / r.height) * 2 - 1);
    this.camera.updateMatrixWorld();
    const hit = this.interaction.at(nx, ny);
    if (!hit) return false;
    this.use(hit);
    return true;
  }

  private use(target: InteractableInfo | null): void {
    if (target?.far) this.callbacks.onTooFar?.(target);
    else this.callbacks.onInteract(target);
  }

  /** Browsers only allow audio after a user gesture: call this from the Start/Resume click. */
  startAudio(): void {
    this.audio.resume();
  }

  setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  // ---- extras used by the procedure mode ----

  /** Add props (and their collision) to the room. */
  addExtras(group: THREE.Object3D, colliders: Rect[] = []): void {
    this.world.scene.add(group);
    this.world.colliders.push(...colliders);
  }

  /** Run something a few times a second with the player's position (cheap level-of-detail work). */
  addUpdater(fn: (x: number, z: number) => void): void {
    this.updaters.push(fn);
  }

  registerExtra(root: THREE.Object3D, info: InteractableInfo, setHighlight?: (on: boolean) => void): void {
    this.interaction.register(root, info, setHighlight);
  }

  relabel(id: string, label: string): void {
    this.interaction.relabel(id, label);
  }

  unregisterExtra(root: THREE.Object3D): void {
    this.interaction.unregister(root);
  }

  /** Command the bed head angle (radians); null gives control back to the patient's own state. */
  setHeadTarget(rad: number | null): void {
    this.headOverride = rad;
  }

  /** Face a point for a few seconds (the nurse looks at the patient while a step is done). */
  focusOn(x: number, y: number, z: number, seconds: number): void {
    this.focusAt = new THREE.Vector3(x, y, z);
    this.focusUntil = this.clock.elapsedTime + seconds;
  }

  /** Add a tube or cable that follows what it is attached to. */
  addCable(points: () => THREE.Vector3[], radius: number, color: number): void {
    this.world.addCable(points, radius, color);
  }

  /** Where the patient's mouth and nose are, in the room. */
  mouthWorld(): THREE.Vector3 {
    return this.world.patient.maskAnchor.getWorldPosition(new THREE.Vector3());
  }

  setAlarmSound(on: boolean): void {
    this.alarmSound = on;
  }

  /** The patient coughs or moans on cue. */
  patientSound(kind: 'cough' | 'moan'): void {
    const gain = this.distanceGain(BED_POS, 7);
    if (kind === 'cough') this.audio.cough(gain);
    else this.audio.moan(gain);
  }

  /** Which way the player faces (radians, 0 = toward -z, positive turns left). */
  playerYaw(): number {
    return this.camera.rotation.y;
  }

  /** Where the player stands on the floor. */
  playerXZ(): { x: number; z: number } {
    return { x: this.camera.position.x, z: this.camera.position.z };
  }

  /**
   * Keeps the frame rate smooth on weak GPUs by lowering the render resolution when it drops below ~40 fps
   * for two seconds (down to 60%), and raising it again when there is room. Off in dev, so tests stay deterministic.
   */
  private governResolution(rawDt: number): void {
    if (import.meta.env.DEV) return;
    this.perfTime += rawDt;
    this.perfFrames++;
    if (this.perfTime < 2) return;
    const fps = this.perfFrames / this.perfTime;
    this.perfTime = 0;
    this.perfFrames = 0;
    let next = this.quality;
    if (fps < 40) next = Math.max(0.6, this.quality - 0.15);
    else if (fps > 57) next = Math.min(1, this.quality + 0.1);
    if (next !== this.quality) {
      this.quality = next;
      this.renderer.setPixelRatio(this.basePixelRatio * next);
      this.resize();
    }
  }

  /** Opens the privacy curtains if closed, closes them if open. Returns true when they are now closed. */
  toggleCurtains(): boolean {
    this.world.curtains.setClosed(!this.world.curtains.closed);
    return this.world.curtains.closed;
  }

  /** BP cuff inflates and deflates on the patient's arm. */
  pulseCuff(seconds: number): void {
    this.world.patient.pulseCuff(seconds);
  }

  /** Stethoscope sounds. */
  listenHeart(): void {
    this.audio.listenHeart(this.patient.getVitals().heartRate);
  }

  listenLungs(crackles: boolean): void {
    this.audio.listenLungs(this.patient.getVitals().respiratoryRate, crackles);
  }

  silenceAlarm(seconds: number): void {
    this.silencedUntil = this.patient.getSimTime() + seconds;
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('keydown', this.onKeyDown);
    this.resizeObserver.disconnect();
    this.controller.dispose();
    this.hands.dispose();
    this.audio.dispose();
    disposeScene(this.world.scene);
    this.world.monitor.display.texture.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private tick = () => {
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 0.05);
    this.governResolution(raw);
    this.updaterClock += raw;
    if (this.updaterClock > 0.12 && this.updaters.length) {
      this.updaterClock = 0;
      for (const fn of this.updaters) fn(this.camera.position.x, this.camera.position.z);
    }
    const time = this.clock.elapsedTime;
    const simDt = this.running ? dt : 0;

    this.patient.tick(simDt);
    this.callbacks.onTick(simDt);
    const vitals = this.patient.getVitals();
    const interventions = this.patient.getInterventions();

    this.syncInterventions(interventions, dt);
    this.updateAlarm(vitals, time);

    if (this.focusAt && this.clock.elapsedTime < this.focusUntil) this.controller.lookToward(this.focusAt.x, this.focusAt.y, this.focusAt.z, 1 - Math.exp(-5 * dt));
    else this.focusAt = null;
    this.wash?.update(dt);
    this.controller.update(dt);
    this.camera.updateMatrixWorld();
    this.sink?.unit.update(dt);
    this.hands.update(dt);
    if (this.controller.locked && !this.wash?.active) this.interaction.update(dt);

    if (vitals !== this.lastVitals) {
      this.lastVitals = vitals;
      this.world.patient.setCondition(vitals);
    }
    this.world.patient.update(simDt, vitals.respiratoryRate);
    this.world.iv.update(simDt);
    this.world.curtains.update(dt, this.camera.position.x, this.camera.position.z);
    this.patientSounds(vitals, simDt, time);
    this.world.monitor.display.update(vitals, time, simDt);
    this.renderer.render(this.world.scene, this.camera);
    if (this.hands.visible) {
      // second pass: the hands are drawn over everything, so they can never sink into a wall or a table
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.hands.scene, this.hands.camera);
      this.renderer.autoClear = true;
    }
  };

  /** Applies what the nurse did (oxygen, bed position) to the 3D scene and the sounds. */
  private syncInterventions(iv: Interventions, dt: number): void {
    if (iv !== this.lastInterventions) {
      this.lastInterventions = iv;
      this.world.setOxygenVisual(iv.oxygen);
    }

    const target = this.headOverride ?? (iv.headElevated ? HEAD_RAISED : 0);
    const diff = target - this.headAngle;
    if (Math.abs(diff) > 0.0005) {
      this.headAngle += Math.sign(diff) * Math.min(1.2 * dt, Math.abs(diff));
      this.world.setHeadAngle(this.headAngle);
    }

    const legTarget = iv.legsRaised ? LEGS_RAISED : 0;
    const legDiff = legTarget - this.legAngle;
    if (Math.abs(legDiff) > 0.0005) {
      this.legAngle += Math.sign(legDiff) * Math.min(0.9 * dt, Math.abs(legDiff));
      this.world.setLegAngle(this.legAngle);
    }

    this.world.iv.setLevel(this.patient.getBagMl() / BAG_ML);
    this.world.iv.setRunning(this.patient.isIvRunning());

    const hiss = this.running && iv.oxygen ? (iv.oxygen.flowLpm / 15) * 0.22 * this.distanceGain(OXYGEN_POS, 5) : 0;
    this.audio.setHiss(hiss);
  }

  private updateAlarm(vitals: ReturnType<PatientModel['getVitals']>, time: number): void {
    const alerts = criticalAlerts(vitals);
    const next: AlarmState = {
      active: alerts.length > 0,
      silenced: alerts.length > 0 && this.patient.getSimTime() < this.silencedUntil,
      codes: alerts,
      message: alerts.map((c) => ALERT_TEXT_EN[c]).join(' · '),
    };
    if (next.active !== this.alarm.active || next.silenced !== this.alarm.silenced || next.message !== this.alarm.message) {
      this.alarm = next;
      this.world.monitor.display.setAlarm(next);
      this.callbacks.onAlarmChange(next);
    }

    const ringing = this.alarm.active && !this.alarm.silenced;
    this.world.monitor.setAlarmLight(ringing && Math.floor(time * 2) % 2 === 0);
    if (ringing && this.running && this.alarmSound) this.audio.alarm(this.distanceGain(MONITOR_POS, 6));
  }

  private nextCoughAt = 6;
  private nextMoanAt = 14;

  /** An unwell patient coughs or moans now and then (quieter with distance, and silent while paused or muted). */
  private patientSounds(vitals: ReturnType<PatientModel['getVitals']>, simDt: number, time: number): void {
    if (simDt <= 0) return;
    const gain = this.distanceGain(BED_POS, 7);
    if (vitals.spo2 < 94 && time >= this.nextCoughAt) {
      this.audio.cough(gain);
      this.nextCoughAt = time + 5 + Math.random() * 9;
    }
    if (vitals.systolic < 100 && vitals.heartRate > 105 && time >= this.nextMoanAt) {
      this.audio.moan(gain);
      this.nextMoanAt = time + 12 + Math.random() * 14;
    }
  }

  /** Quieter when the player is far from the source. */
  private distanceGain(pos: THREE.Vector3, range: number): number {
    return clamp(1.5 - this.camera.position.distanceTo(pos) / range, 0.1, 1);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.wash?.active) return; // hands are busy
    if (e.code === 'KeyE' && !e.repeat && this.controller.locked) this.use(this.interaction.target);
  };

  private resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.hands.setAspect(w / h);
  }
}
