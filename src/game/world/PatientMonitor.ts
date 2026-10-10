import * as THREE from 'three';
import { blobShadow, box, cyl, sphere } from './helpers';
import { MonitorDisplay } from './MonitorDisplay';
import { cloneModel, findMesh, localBox, ownMaterial } from './models';

export interface PatientMonitor {
  group: THREE.Group;
  display: MonitorDisplay;
  cableSocket: THREE.Object3D; // where patient cables plug in
  setHighlight(on: boolean): void;
  setAlarmLight(on: boolean): void;
}

/** Rolling monitor stand with a screen showing live vitals. Origin = floor, screen faces +z. */
export function createPatientMonitor(): PatientMonitor {
  return createFromModel() ?? createProcedural();
}

/** GLB version: the live canvas replaces the model's screen texture. Falls back (null) if the model is missing. */
function createFromModel(): PatientMonitor | null {
  const model = cloneModel('patientMonitor');
  const screen = model ? findMesh(model, 'Screen') : undefined;
  if (!model || !screen) return null;

  const group = new THREE.Group();
  group.add(blobShadow(0.9, 0.9, 0, 0));

  const display = new MonitorDisplay();
  // glTF UVs are not flipped vertically like CanvasTexture's default
  display.texture.flipY = false;
  display.texture.needsUpdate = true;
  screen.material = new THREE.MeshBasicMaterial({ map: display.texture, side: THREE.DoubleSide });

  const bezelMat = ownMaterial(model, 'Bezel');
  const alarmMats = ['AlarmLight', 'AlarmLight.001']
    .map((n) => ownMaterial(model, n))
    .filter((m): m is THREE.MeshLambertMaterial => m !== null)
    .map((m) => ({ m, color: m.color.clone(), emissive: m.emissive.clone() }));

  // Patient leads plug into the centre port at the bottom of the unit
  const cableSocket = new THREE.Object3D();
  const port = localBox(model, 'Port.001');
  if (port) cableSocket.position.copy(port.getCenter(new THREE.Vector3()));
  else cableSocket.position.set(0, 1.0, -0.06);
  model.add(cableSocket);

  model.rotation.y = Math.PI; // models face -z, the screen must face +z
  group.add(model);

  return {
    group,
    display,
    cableSocket,
    setHighlight(on) {
      bezelMat?.emissive.setHex(on ? 0x1b8f93 : 0x000000);
    },
    setAlarmLight(on) {
      for (const a of alarmMats) {
        a.m.color.copy(on ? new THREE.Color(0xff2b2b) : a.color);
        a.m.emissive.copy(on ? new THREE.Color(0xff1010) : a.emissive);
      }
    },
  };
}

function createProcedural(): PatientMonitor {
  const group = new THREE.Group();
  group.add(blobShadow(0.9, 0.9, 0, 0));

  group.add(cyl(0.24, 0.26, 0.05, 0x37474f, 0, 0.05, 0, 1, 20));
  for (const [x, z] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]]) group.add(sphere(0.035, 0x263238, x, 0.035, z, 8));
  group.add(cyl(0.022, 0.022, 1.25, 0xb0bec5, 0, 0.7, 0, 1, 10));
  group.add(box(0.14, 0.1, 0.1, 0x607d8b, 0, 1.3, 0));

  // Head unit; bezel has its own material so it can glow when targeted
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0.02);
  const bezelMat = new THREE.MeshLambertMaterial({ color: 0x2b3338 });
  head.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.09), bezelMat));

  const display = new MonitorDisplay();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ map: display.texture }));
  screen.position.z = 0.046;
  head.add(screen);
  head.add(box(0.22, 0.02, 0.03, 0x607d8b, 0, 0.215, 0)); // handle

  const lightMat = new THREE.MeshBasicMaterial({ color: 0x5a4300 });
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.014, 0.014), lightMat);
  light.position.set(0, 0.206, 0.03);
  head.add(light);

  // Patient cable sockets on the right side of the unit
  const cableSocket = new THREE.Object3D();
  cableSocket.position.set(0.31, -0.12, 0);
  head.add(cableSocket);
  head.add(box(0.03, 0.1, 0.05, 0x1c2428, 0.3, -0.12, 0));

  group.add(head);

  return {
    group,
    display,
    cableSocket,
    setHighlight(on) {
      bezelMat.emissive.setHex(on ? 0x1b8f93 : 0x000000);
    },
    setAlarmLight(on) {
      lightMat.color.setHex(on ? 0xff2b2b : 0x5a4300);
    },
  };
}
