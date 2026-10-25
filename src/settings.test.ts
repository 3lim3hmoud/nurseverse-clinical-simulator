import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULTS, getSettings, resetSettings, sanitize, setSpot, updateSettings } from './settings';

describe('settings', () => {
  beforeEach(() => resetSettings());

  it('starts with the defaults', () => {
    expect(getSettings()).toEqual(DEFAULTS);
  });

  it('keeps every value inside its limits and ignores junk', () => {
    const s = sanitize({ joySize: 99, actSize: -4, opacity: 'high', lookSens: NaN, leftHanded: 'yes', quality: 'ultra', panel: 'closed', layout: 5 });
    expect(s.joySize).toBe(1.6);
    expect(s.actSize).toBe(0.7);
    expect(s.opacity).toBe(DEFAULTS.opacity);
    expect(s.lookSens).toBe(DEFAULTS.lookSens);
    expect(s.leftHanded).toBe(false);
    expect(s.quality).toBe('auto');
    expect(s.panel).toBe('closed');
    expect(s.layout).toEqual({ landscape: {}, portrait: {} });
  });

  it('survives garbage from storage', () => {
    expect(sanitize(null)).toEqual(DEFAULTS);
    expect(sanitize('x')).toEqual(DEFAULTS);
    expect(sanitize({ layout: { landscape: { joy: { x: 'a', y: 1 }, act: { x: 5, y: -2 } } } }).layout.landscape).toEqual({ act: { x: 0.97, y: 0.03 } });
  });

  it('remembers where each control was moved, per way of holding the phone, and can put it back', () => {
    setSpot('landscape', 'act', { x: 0.7, y: 0.6 });
    setSpot('portrait', 'joy', { x: 0.2, y: 0.8 });
    expect(getSettings().layout.landscape.act).toEqual({ x: 0.7, y: 0.6 });
    expect(getSettings().layout.portrait.joy).toEqual({ x: 0.2, y: 0.8 });
    expect(getSettings().layout.landscape.joy).toBeUndefined();
    setSpot('landscape', 'act', null);
    expect(getSettings().layout.landscape.act).toBeUndefined();
    expect(getSettings().layout.portrait.joy).toBeDefined();
  });

  it('changes one setting without touching the others', () => {
    updateSettings({ lookSens: 1.8, leftHanded: true });
    expect(getSettings()).toMatchObject({ lookSens: 1.8, leftHanded: true, joySize: 1, vibrate: true });
  });
});
