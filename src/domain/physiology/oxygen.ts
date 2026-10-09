export type OxygenDevice = 'nasal-cannula' | 'simple-mask' | 'non-rebreather';

export interface OxygenSetup {
  device: OxygenDevice;
  flowLpm: number;
}

export interface DeviceInfo {
  labelKey: string; // i18n keys
  summaryKey: string;
  flows: number[]; // flow rates offered in the UI
  goodRange: [number, number]; // recommended L/min (used by scoring, never shown before the debrief)
}

export const OXYGEN_DEVICES: Record<OxygenDevice, DeviceInfo> = {
  'nasal-cannula': {
    labelKey: 'device.nasal',
    summaryKey: 'device.nasal.sum',
    flows: [1, 2, 3, 4, 5, 6],
    goodRange: [1, 6],
  },
  'simple-mask': {
    labelKey: 'device.mask',
    summaryKey: 'device.mask.sum',
    flows: [2, 4, 5, 6, 8, 10],
    goodRange: [5, 10],
  },
  'non-rebreather': {
    labelKey: 'device.nrb',
    summaryKey: 'device.nrb.sum',
    flows: [6, 8, 10, 12, 15],
    goodRange: [10, 15],
  },
};

/** Approximate delivered FiO2 (educational simplification). */
export function fio2(s: OxygenSetup): number {
  const f = s.flowLpm;
  switch (s.device) {
    case 'nasal-cannula':
      return Math.min(0.21 + 0.04 * f, 0.45);
    case 'simple-mask':
      return f >= 5 ? Math.min(0.4 + 0.04 * (f - 5), 0.6) : 0.3; // <5 L/min: exhaled CO2 not flushed
    case 'non-rebreather':
      return f >= 10 ? Math.min(0.6 + 0.06 * (f - 10), 0.9) : 0.4; // <10 L/min: reservoir bag collapses
  }
}

export function isFlowAppropriate(s: OxygenSetup): boolean {
  const [lo, hi] = OXYGEN_DEVICES[s.device].goodRange;
  return s.flowLpm >= lo && s.flowLpm <= hi;
}
