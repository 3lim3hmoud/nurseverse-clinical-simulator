# NurseVerse Clinical Simulator

Lightweight browser-based 3D nursing simulator (React + TypeScript + Three.js + Vite).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview
```

Controls: **WASD** move · **Mouse** look · **Shift** walk faster · **E** interact · **M** sound · **Esc** pause.

## Cases

Pick a case from the menu (English or Arabic, switch any time):

- **Short of breath**: 58-year-old man, falling SpO₂. Oxygen device + flow, sitting upright.
- **Low blood pressure**: 34-year-old woman with dehydration. IV fluid type + rate, raising the legs.
- **Low blood sugar**: 67-year-old diabetic man, sweaty and confused. Glucometer first, then oral glucose, IV dextrose or glucagon, then recheck.

## Talk to the patient, SBAR report and debrief

- **Talk to the patient** (patient panel): type any question in English or Arabic, or tap a ready-made one. The patient answers from the case history, and the answer follows how sick they are right now. It works fully offline (`services/ai/LocalPatientConversation.ts`). The sim clock is paused while you type.
- **SBAR report**: "Notify the doctor" opens a handover. Background only shows what you actually asked, and you choose the recommendation.
- **Debrief** on the results screen: what went well, what to work on, and what to do next time, built from the score and your event log.
- Scoring totals are unchanged. History taking and SBAR quality appear in the debrief, not in the score.

### Optional: let an LLM write the answers

Set `VITE_AI_ENDPOINT` when building to point at **your own server** (a small proxy that calls the model). Never put a model API key in this app: it would be public. The request/response contract is documented in `services/ai/RemoteServices.ts`. If the endpoint is empty, slow or fails, the offline patient answers, so the simulator always works. Intents are always detected locally, so the debrief works the same either way.

## Oxygen case details (Emergency Bay 3)

A 58-year-old man with shortness of breath and fever. His SpO₂ is falling. Press **E** while looking at:

- the **patient monitor**: live vital signs, silence the alarm
- the **oxygen device**: choose device (nasal cannula / simple mask / non-rebreather) and flow rate
- the **IV stand**: fluid type and rate, stop/start, hang a new bag
- the **patient / bed**: ask, skin check, stethoscope (heart/lungs, with sound), thermometer, BP cuff, raise head or legs, notify the doctor

The case ends when the patient is stable and the doctor is notified, when SpO₂ falls too low, after 6 minutes,
or when you choose *Finish and see results* in the pause menu. You get a score out of 100 with feedback and a timeline.

## On a phone

Touch devices get a virtual joystick (left), drag-to-look (right) and an **E** button automatically.

- Same Wi-Fi as the PC: run `npm run dev`, then open the `Network:` address Vite prints (e.g. `http://192.168.1.20:5173`) in the phone browser.
- Or host the build: `npm run build`, then upload `dist/` to GitHub Pages (paths are already relative).

## Structure

```
src/
  main.tsx, App.tsx, styles.css     React entry + screen composition
  ui/                               HUD, start overlay, vitals panel (React only, no Three.js)
  game/                             Three.js layer
    Simulator.ts                    renderer, loop, player, bridge to React
    layout.ts                       room size + positions of every object
    controls/FirstPersonController  WASD + mouse look + collision
    interaction/InteractionSystem   centre-screen raycast, "E" targets
    world/                          room, bed (raisable back), patient, monitor, IV stand, oxygen, cables
    audio/AudioEngine.ts            generated sounds: pulse beep, alarm, oxygen hiss
  domain/                           simulation logic, no rendering
    patient/                        PatientModel, Vitals, assessment ranges
    scenarios/                      scenario definitions (Emergency Bay 3)
    physiology/                     oxygen devices, HypoxiaEngine (SpO2/HR/RR/BP react to treatment)
    scenarios/                      scenario definition + ScenarioSession (when the case ends)
    scoring/                        ScenarioScorer (100 points) + results timeline
    decision/                       interface for the future clinical decision engine
  services/ai/                      interfaces: patient conversation, debriefing
  core/EventLog.ts                  records student actions for scoring/debrief
```

## Performance choices

No shadows, only 2 lights, Lambert materials shared from a cache, fake blob shadows, low-poly geometry,
pixel ratio capped at 1.5, monitor screen drawn on one small canvas texture.

## Adding the next features

- Physiology: implement `PhysiologyEngine` and call it from `PatientModel.tick`.
- Decision engine / scoring: consume `EventLog` events and `Scenario` data.
- New equipment: add a builder in `game/world/`, place it in `ClinicalScene.ts`, register it with `InteractionSystem.register`.
- AI conversation / debriefing: implement `PatientConversationService` / `DebriefingService` in `services/ai`.
- New case: add an engine, a scorer, findings and a scenario in `domain/scenarios`, plus `hx.<id>.*` interview answers and `sbar.*` strings in `i18n/extra-*.ts`.
