# NurseVerse – roadmap

## Now: MVP = MV Care (mechanical ventilation care)
- One procedure, 13 steps, 23 items (17 on the supply tables + 6 already at the bedside), in two modes:
  **Practice** (AI coach, arrow, map, equipment list) and **Exam** (no hints, distractor items and steps, clock).
- Everything the nurse needs is in one **side dashboard** (progress, what to do now, Steps, Map, Tray, Coach).
  Phone held sideways: dashboard on the right. Held upright: room on top, dashboard below. ☰ hides it.
- Three clinical cases (breathing, blood pressure, blood sugar) stay available under the procedure.
  Switch them off with `FEATURES.clinicalCases = false` in `src/config.ts`.

## Interaction rules (so "E on the patient" always works)
- The patient and bed can be used from up to 3.8 m, everything else from 3 m (`src/game/layout.ts`).
- Aim assist: a few rays around the crosshair are tried, so you do not need to hit the exact pixel.
- Too far: the prompt says "Move closer" and pressing E / tapping says the same, instead of doing nothing.
- Phone: tap an object directly, or use the E button. Desktop: E.
- Practice: E on the patient does the bedside step that is due; otherwise it opens the Steps tab.

## Next procedures (parked in `docs/future-procedures.json`)
Add one at a time: tracheostomy care, ACLS, TPN, arterial catheter, PA catheter, then the VAP / CAUTI / CLABSI bundles.
To bring one back:
1. Move its object from `docs/future-procedures.json` into `RAW_PROCEDURES` (`src/domain/procedures/rawData.ts`).
2. Add its id to `ProcedureId` (`types.ts`) and a patient to `PATIENTS` (`stablePatient.ts`).
3. For a bundle (any order, no equipment in the source) restore `ordered: false` and an equipment list in `catalog.ts`
   (see git history before the MV-only change).
4. Add tests next to the MV ones in `procedures.test.ts`.

## Ideas
- Show FiO₂ on the ventilator screen during pre-oxygenation and suction.
- Cuff-pressure manometer as its own small interaction.
- Teacher view: export the result of a run.
