import * as THREE from 'three';
import type { Vitals } from '../../domain/patient/types';

const W = 512;
const H = 320;
const WAVE = { x: 8, y: 40, w: 342, h: 112 };
const PX_PER_SEC = 90;
const R_PHASE = 0.33; // position of the R peak inside one beat
const FONT = '"Segoe UI", Arial, sans-serif';

export interface DisplayAlarm {
  active: boolean;
  silenced: boolean;
  message: string;
}

/** One ECG beat, phase 0..1 -> roughly -0.3..1. */
function ecg(p: number): number {
  const g = (c: number, w: number, a: number) => a * Math.exp(-((p - c) ** 2) / (2 * w * w));
  return g(0.18, 0.025, 0.12) - g(0.3, 0.008, 0.15) + g(R_PHASE, 0.01, 1) - g(0.36, 0.01, 0.25) + g(0.58, 0.045, 0.25);
}

/** Draws the patient monitor screen on a canvas texture (numbers redraw only on change, ECG sweeps ~20 fps). */
export class MonitorDisplay {
  readonly texture: THREE.CanvasTexture;
  /** Called when the ECG trace passes an R peak (used for the beep). */
  onBeat?: () => void;

  private ctx: CanvasRenderingContext2D;
  private acc = 0;
  private sweep = 0;
  private phase = 0;
  private prevY: number | null = null;
  private key = '';
  private lastBlink = true;
  private title = 'Patient monitor';
  private alarm: DisplayAlarm = { active: false, silenced: false, message: '' };

  constructor() {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.anisotropy = 4;
    this.ctx.fillStyle = '#05090b';
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.fillStyle = '#1b2a2e';
    this.ctx.fillRect(354, 36, 2, 276);
    this.ctx.fillRect(8, 158, 342, 2);
  }

  setTitle(bay: string): void {
    this.title = `${bay} · Patient monitor`;
    this.key = '';
  }

  setAlarm(a: DisplayAlarm): void {
    this.alarm = a;
    this.key = ''; // force a redraw
  }

  update(v: Vitals, time: number, dt: number): void {
    let dirty = false;
    const blink = Math.floor(time * 2) % 2 === 0;
    const a = this.alarm;
    const flashing = a.active && !a.silenced;

    const key = `${v.heartRate}|${v.spo2}|${v.respiratoryRate}|${v.systolic}|${v.diastolic}|${v.temperatureC}|${a.active}|${a.silenced}|${a.message}`;
    if (key !== this.key) {
      this.key = key;
      this.drawNumbers(v);
      this.drawBorder(flashing && blink);
      this.lastBlink = blink;
      dirty = true;
    } else if (blink !== this.lastBlink) {
      this.lastBlink = blink;
      if (flashing) {
        this.drawBorder(blink);
        dirty = true;
      }
    }

    this.acc += dt;
    if (this.acc >= 1 / 20) {
      this.drawWave(v.heartRate, this.acc);
      this.acc = 0;
      dirty = true;
    }
    if (dirty) this.texture.needsUpdate = true;
  }

  private drawBorder(on: boolean): void {
    const c = this.ctx;
    c.strokeStyle = on ? '#ff3b3b' : '#05090b';
    c.lineWidth = 6;
    c.strokeRect(3, 3, W - 6, H - 6);
  }

  private drawNumbers(v: Vitals): void {
    const c = this.ctx;
    const a = this.alarm;
    c.fillStyle = '#05090b';
    c.fillRect(0, 0, W, 34);
    c.fillRect(360, 36, 152, 284);
    c.fillRect(0, 162, 352, 158);

    c.textBaseline = 'alphabetic';
    c.font = `bold 16px ${FONT}`;
    if (a.active && !a.silenced) {
      c.fillStyle = '#ff5a5a';
      c.fillText(`ALARM: ${a.message}`, 12, 23);
    } else if (a.active) {
      c.fillStyle = '#ffc247';
      c.fillText(`Alarm silenced · ${a.message}`, 12, 23);
    } else {
      c.fillStyle = '#7fd4d9';
      c.fillText(this.title, 12, 23);
    }
    c.fillStyle = '#3cff8a';
    c.beginPath();
    c.arc(486, 18, 5, 0, Math.PI * 2);
    c.fill();

    const block = (label: string, value: string, color: string, x: number, y: number, size: number) => {
      c.fillStyle = color;
      c.font = `bold 15px ${FONT}`;
      c.fillText(label, x, y);
      c.font = `bold ${size}px ${FONT}`;
      c.fillText(value, x, y + size + 2);
    };
    block('HR  bpm', String(v.heartRate), '#3cff8a', 368, 56, 54);
    block('SpO₂  %', String(v.spo2), '#4fd8ff', 368, 136, 54);
    block('RR  /min', String(v.respiratoryRate), '#ffe45c', 368, 216, 54);
    block('NIBP  mmHg', `${v.systolic}/${v.diastolic}`, '#ff7a7a', 14, 188, 50);
    block('Temp  °C', v.temperatureC.toFixed(1), '#e9eef0', 214, 188, 50);
  }

  private drawWave(hr: number, step: number): void {
    const c = this.ctx;
    const n = Math.max(1, Math.round(step * PX_PER_SEC));
    const phaseStep = hr / 60 / PX_PER_SEC;
    let beat = false;
    c.strokeStyle = '#3cff8a';
    c.lineWidth = 2;
    c.lineJoin = 'round';

    for (let i = 0; i < n; i++) {
      const x = this.sweep;
      const before = this.phase;
      this.phase += phaseStep;
      if (this.phase >= 1) this.phase -= 1;
      if (before < R_PHASE && this.phase >= R_PHASE) beat = true;

      const y = WAVE.y + WAVE.h * 0.7 - ecg(this.phase) * WAVE.h * 0.62;
      c.fillStyle = '#05090b';
      c.fillRect(WAVE.x + x, WAVE.y, 6, WAVE.h);
      if (this.prevY !== null && x > 0) {
        c.beginPath();
        c.moveTo(WAVE.x + x - 1, this.prevY);
        c.lineTo(WAVE.x + x, y);
        c.stroke();
      }
      this.prevY = y;
      this.sweep = x + 1 >= WAVE.w ? 0 : x + 1;
      if (this.sweep === 0) this.prevY = null;
    }
    if (beat) this.onBeat?.();
  }
}
