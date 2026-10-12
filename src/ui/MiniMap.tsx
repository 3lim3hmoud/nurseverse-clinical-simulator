import { useEffect, useRef } from 'react';
import { BED_CENTER, BED_CONTROL, HYGIENE_STATION, type Point } from '../domain/procedures/layoutPoints';
import { ROOM } from '../game/layout';
import { useI18n } from '../i18n';

interface Props {
  rects: { cx: number; cz: number; w: number; d: number; number: number }[];
  player: { x: number; z: number; yaw: number };
  /** where the guide points (practice only) */
  target: Point | null;
}

const W = 150;
const H = Math.round((W * (ROOM.maxZ - ROOM.minZ)) / (ROOM.maxX - ROOM.minX)); // keeps the room's shape

/** Floor plan, north (the headwall) at the top. Shows the bed, the hygiene station, the tables, you and the target. */
export default function MiniMap({ rects, player, target }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = W / (ROOM.maxX - ROOM.minX);
    const px = (x: number) => (x - ROOM.minX) * sx;
    const pz = (z: number) => (z - ROOM.minZ) * sx;

    g.clearRect(0, 0, W, H);
    g.fillStyle = '#eaf2f3';
    g.fillRect(0, 0, W, H);
    // the bay with the curtains
    g.strokeStyle = '#7fb5b0';
    g.setLineDash([3, 2]);
    g.strokeRect(px(-2.7), pz(-3), px(2.7) - px(-2.7), pz(0.7) - pz(-3));
    g.setLineDash([]);
    // bed
    g.fillStyle = '#9db4b9';
    g.fillRect(px(-0.5), pz(-2.45), px(0.5) - px(-0.5), pz(-0.35) - pz(-2.45));
    g.fillStyle = '#37b36f';
    g.beginPath();
    g.arc(px(BED_CONTROL.x), pz(BED_CONTROL.z), 2.5, 0, Math.PI * 2);
    g.fill();
    // tables
    g.font = '700 9px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const r of rects) {
      g.fillStyle = '#d9822b';
      g.fillRect(px(r.cx - r.w / 2), pz(r.cz - r.d / 2), Math.max(5, r.w * sx), Math.max(5, r.d * sx));
      g.fillStyle = '#fff';
      g.fillText(String(r.number), px(r.cx), pz(r.cz));
    }
    // hand-hygiene station
    g.fillStyle = '#2b8cc4';
    g.beginPath();
    g.arc(px(HYGIENE_STATION.x), pz(HYGIENE_STATION.z), 4, 0, Math.PI * 2);
    g.fill();
    // target
    if (target) {
      g.strokeStyle = '#0fb5a8';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(px(target.x), pz(target.z), 7, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 1;
    }
    // you: a triangle pointing the way you face (yaw 0 = toward -z = up)
    g.save();
    g.translate(px(player.x), pz(player.z));
    g.rotate(-player.yaw);
    g.fillStyle = '#c0392b';
    g.beginPath();
    g.moveTo(0, -6);
    g.lineTo(4.5, 5);
    g.lineTo(-4.5, 5);
    g.closePath();
    g.fill();
    g.restore();
    void BED_CENTER;
  }, [rects, player.x, player.z, player.yaw, target]);

  return <canvas ref={ref} className="minimap" width={W} height={H} style={{ width: W, height: H }} aria-label={t('map.title')} />;
}
