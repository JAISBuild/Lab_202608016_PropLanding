"use client";

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number };
type Building = {
  name: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  floors: number;
  tone: [number, number, number];
};

const SITE = { w: 240, h: 188 };
const DAY_MS = 18000;
const GROUND_SRC = "/images/sun-study-ground.jpg";

const DONGS: Building[] = [
  { name: "101동", x: 18, y: 28, w: 86, d: 15, h: 74, floors: 24, tone: [232, 221, 204] },
  { name: "102동", x: 128, y: 24, w: 92, d: 15, h: 80, floors: 26, tone: [226, 214, 196] },
  { name: "103동", x: 16, y: 78, w: 78, d: 15, h: 66, floors: 21, tone: [236, 226, 210] },
  { name: "104동", x: 140, y: 74, w: 82, d: 15, h: 70, floors: 23, tone: [228, 216, 198] },
  { name: "105동", x: 36, y: 116, w: 88, d: 15, h: 58, floors: 18, tone: [234, 223, 206] },
  { name: "106동", x: 146, y: 112, w: 74, d: 15, h: 54, floors: 17, tone: [230, 218, 200] },
];

const AMENITY: Building = {
  name: "커뮤니티",
  x: 102,
  y: 96,
  w: 34,
  d: 22,
  h: 12,
  floors: 2,
  tone: [210, 228, 214],
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rgb(r: number, g: number, b: number, a = 1) {
  return `rgba(${clamp(r, 0, 255) | 0},${clamp(g, 0, 255) | 0},${clamp(b, 0, 255) | 0},${a})`;
}

function shade(tone: [number, number, number], light: number) {
  const k = 0.16 + clamp(light, 0, 1) * 0.92;
  return rgb(tone[0] * k, tone[1] * k, tone[2] * k);
}

function convexHull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 2) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function sunAt(dayT: number) {
  const azimuth = ((90 + dayT * 180) * Math.PI) / 180;
  const elevation = Math.max(0.1, Math.sin(dayT * Math.PI) * 0.95);
  return {
    azimuth,
    elevation,
    x: Math.sin(azimuth) * Math.cos(elevation),
    y: -Math.cos(azimuth) * Math.cos(elevation),
    z: Math.sin(elevation),
  };
}

function formatClock(dayT: number) {
  const hour = 6 + dayT * 13;
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatPhase(dayT: number) {
  if (dayT < 0.16) return "일출 · 동향면 일조";
  if (dayT < 0.38) return "오전 · 남동면";
  if (dayT < 0.62) return "정오 · 남향 일조";
  if (dayT < 0.84) return "오후 · 남서면";
  return "일몰 · 서향면 일조";
}

function projectFn(cw: number, ch: number) {
  const pad = 18;
  const scale = Math.min((cw - pad * 2) / SITE.w, (ch - pad * 2) / (SITE.h * 0.58 + 92));
  const ox = (cw - SITE.w * scale) / 2;
  const oy = pad + 70 * scale;
  return (x: number, y: number, z: number): Pt => ({
    x: ox + x * scale,
    y: oy + y * scale * 0.58 - z * scale * 0.9,
  });
}

function fillPoly(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string) {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function quad(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, c: Pt, d: Pt, fill: string) {
  fillPoly(ctx, [a, b, c, d], fill);
}

function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function drawWindows(
  ctx: CanvasRenderingContext2D,
  tl: Pt,
  tr: Pt,
  br: Pt,
  bl: Pt,
  cols: number,
  floors: number,
  dusk: boolean,
  faceLit: number,
) {
  const c = Math.max(4, cols);
  const f = Math.max(4, floors);
  for (let row = 0; row < f; row += 1) {
    const v0 = (row + 0.18) / f;
    const v1 = (row + 0.78) / f;
    for (let col = 0; col < c; col += 1) {
      if ((row + col) % 5 === 0) continue;
      const u0 = (col + 0.18) / c;
      const u1 = (col + 0.82) / c;
      const p0 = lerpPt(lerpPt(tl, tr, u0), lerpPt(bl, br, u0), v0);
      const p1 = lerpPt(lerpPt(tl, tr, u1), lerpPt(bl, br, u1), v0);
      const p2 = lerpPt(lerpPt(tl, tr, u1), lerpPt(bl, br, u1), v1);
      const p3 = lerpPt(lerpPt(tl, tr, u0), lerpPt(bl, br, u0), v1);
      const lit = dusk && (row * 13 + col * 7) % 4 === 0;
      if (lit) {
        quad(ctx, p0, p1, p2, p3, rgb(255, 214, 140, 0.92));
      } else {
        quad(ctx, p0, p1, p2, p3, rgb(38, 48, 62, 0.28 + faceLit * 0.22));
      }
    }
  }
}

function shadowPoints(b: Building, dx: number, dy: number): Pt[] {
  const corners = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.d },
    { x: b.x, y: b.y + b.d },
  ];
  return convexHull([...corners, ...corners.map((c) => ({ x: c.x + dx, y: c.y + dy }))]);
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  project: (x: number, y: number, z: number) => Pt,
  b: Building,
  sun: ReturnType<typeof sunAt>,
  dusk: boolean,
) {
  const east = clamp(0.12 + sun.x * 0.95, 0.08, 1);
  const west = clamp(0.12 - sun.x * 0.95, 0.08, 1);
  const south = clamp(0.14 + sun.y * 1.05, 0.08, 1);
  const roof = clamp(0.28 + sun.z * 0.75, 0.18, 1);
  const showEast = sun.x >= -0.08;

  const s0 = project(b.x, b.y + b.d, 0);
  const s1 = project(b.x + b.w, b.y + b.d, 0);
  const s2 = project(b.x + b.w, b.y + b.d, b.h);
  const s3 = project(b.x, b.y + b.d, b.h);
  const e0 = project(b.x + b.w, b.y, 0);
  const e1 = project(b.x + b.w, b.y + b.d, 0);
  const e2 = project(b.x + b.w, b.y + b.d, b.h);
  const e3 = project(b.x + b.w, b.y, b.h);
  const w0 = project(b.x, b.y, 0);
  const w1 = project(b.x, b.y + b.d, 0);
  const w2 = project(b.x, b.y + b.d, b.h);
  const w3 = project(b.x, b.y, b.h);
  const r0 = project(b.x, b.y, b.h);
  const r1 = project(b.x + b.w, b.y, b.h);
  const r2 = project(b.x + b.w, b.y + b.d, b.h);
  const r3 = project(b.x, b.y + b.d, b.h);

  if (showEast) {
    quad(ctx, e0, e1, e2, e3, shade(b.tone, east));
    drawWindows(ctx, e3, e2, e1, e0, Math.round(b.d / 4), b.floors, dusk, east);
  } else {
    quad(ctx, w0, w1, w2, w3, shade(b.tone, west));
    drawWindows(ctx, w3, w2, w1, w0, Math.round(b.d / 4), b.floors, dusk, west);
  }

  quad(ctx, s0, s1, s2, s3, shade(b.tone, south));
  drawWindows(ctx, s3, s2, s1, s0, Math.round(b.w / 5.5), b.floors, dusk, south);

  quad(ctx, r0, r1, r2, r3, shade([b.tone[0] - 8, b.tone[1] - 6, b.tone[2] - 10], roof));
  ctx.strokeStyle = rgb(255, 255, 255, 0.18 + roof * 0.12);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r0.x, r0.y);
  ctx.lineTo(r1.x, r1.y);
  ctx.lineTo(r2.x, r2.y);
  ctx.lineTo(r3.x, r3.y);
  ctx.closePath();
  ctx.stroke();

  const label = project(b.x + b.w / 2, b.y + b.d / 2, b.h + 1.4);
  ctx.font = "700 11px Pretendard, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = rgb(27, 19, 40, 0.82);
  ctx.fillText(b.name, label.x, label.y);
}

function skyColor(dayT: number) {
  const rise = 1 - Math.sin(dayT * Math.PI);
  if (dayT < 0.5) {
    return [
      lerp(92, 118, dayT * 2),
      lerp(78, 168, dayT * 2),
      lerp(118, 196, dayT * 2),
      rise,
    ] as const;
  }
  return [
    lerp(118, 27, (dayT - 0.5) * 2),
    lerp(168, 19, (dayT - 0.5) * 2),
    lerp(196, 40, (dayT - 0.5) * 2),
    rise,
  ] as const;
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  dayT: number,
  ground: HTMLImageElement | null,
) {
  const sun = sunAt(dayT);
  const project = projectFn(cw, ch);
  const dusk = dayT > 0.78 || dayT < 0.1;
  const sky = skyColor(dayT);
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = rgb(sky[0], sky[1], sky[2]);
  ctx.fillRect(0, 0, cw, ch);

  const g0 = project(0, 0, 0);
  const g1 = project(SITE.w, 0, 0);
  const g2 = project(SITE.w, SITE.h, 0);
  const g3 = project(0, SITE.h, 0);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(g0.x, g0.y);
  ctx.lineTo(g1.x, g1.y);
  ctx.lineTo(g2.x, g2.y);
  ctx.lineTo(g3.x, g3.y);
  ctx.closePath();
  ctx.clip();
  if (ground) {
    const minX = Math.min(g0.x, g1.x, g2.x, g3.x);
    const minY = Math.min(g0.y, g1.y, g2.y, g3.y);
    const maxX = Math.max(g0.x, g1.x, g2.x, g3.x);
    const maxY = Math.max(g0.y, g1.y, g2.y, g3.y);
    ctx.drawImage(ground, minX, minY, maxX - minX, maxY - minY);
  } else {
    ctx.fillStyle = rgb(92, 128, 78);
    ctx.fill();
  }
  ctx.fillStyle = rgb(sky[0], sky[1] * 0.85, sky[2] * 0.7, 0.08 + sky[3] * 0.16);
  ctx.fillRect(g0.x - 40, g0.y - 40, cw + 80, ch + 80);
  ctx.restore();

  const length = (1 / Math.tan(sun.elevation)) * 0.92;
  const dx = -Math.sin(sun.azimuth) * length;
  const dy = Math.cos(sun.azimuth) * length;
  const shadowAlpha = 0.22 + (1 - sun.z) * 0.22;

  ctx.save();
  ctx.shadowColor = rgb(12, 10, 22, 0.4);
  ctx.shadowBlur = 18;
  for (const b of [...DONGS, AMENITY]) {
    const hull = shadowPoints(b, dx * b.h, dy * b.h).map((p) => project(p.x, p.y, 0));
    fillPoly(ctx, hull, rgb(18, 14, 28, shadowAlpha));
  }
  ctx.restore();

  const ordered = [...DONGS, AMENITY].sort((a, b) => a.y + a.d - (b.y + b.d));
  for (const b of ordered) drawBuilding(ctx, project, b, sun, dusk);

  const n = project(18, 14, 0);
  ctx.fillStyle = rgb(255, 255, 255, 0.9);
  ctx.font = "700 10px Pretendard, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", n.x, n.y - 18);
  ctx.beginPath();
  ctx.moveTo(n.x, n.y - 12);
  ctx.lineTo(n.x - 5, n.y);
  ctx.lineTo(n.x + 5, n.y);
  ctx.closePath();
  ctx.fillStyle = "#c8eb4a";
  ctx.fill();

  const sunPt = project(
    SITE.w / 2 + Math.sin(sun.azimuth) * 108,
    SITE.h / 2 - Math.cos(sun.azimuth) * 78,
    28 + sun.z * 86,
  );
  const glow = ctx.createRadialGradient(sunPt.x, sunPt.y, 2, sunPt.x, sunPt.y, 54);
  const warm = sky[3];
  glow.addColorStop(0, rgb(255, 244, 210, 0.95));
  glow.addColorStop(0.18, rgb(255, 196, 92, 0.7 + warm * 0.2));
  glow.addColorStop(1, rgb(255, 160, 60, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunPt.x, sunPt.y, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgb(255, 250, 230);
  ctx.beginPath();
  ctx.arc(sunPt.x, sunPt.y, 8 + sun.z * 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rgb(255, 255, 255, 0.28);
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    const az = ((90 + t * 180) * Math.PI) / 180;
    const el = Math.max(0.1, Math.sin(t * Math.PI) * 0.95);
    const p = project(
      SITE.w / 2 + Math.sin(az) * 108,
      SITE.h / 2 - Math.cos(az) * 78,
      28 + Math.sin(el) * 86,
    );
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = rgb(255, 255, 255, 0.72);
  ctx.font = "600 9px Pretendard, sans-serif";
  ctx.textAlign = "left";
  const eastTag = project(SITE.w - 8, SITE.h / 2, 0);
  const westTag = project(10, SITE.h / 2, 0);
  ctx.fillText("동 · 일출", eastTag.x - 42, 28);
  ctx.fillText("서 · 일몰", westTag.x, 28);
}

export function PlSunStudy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ground = new Image();
    ground.src = GROUND_SRC;
    let groundReady: HTMLImageElement | null = null;
    ground.onload = () => {
      groundReady = ground;
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    let running = true;
    const started = performance.now();

    const fit = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, parent.clientWidth);
      const h = Math.max(1, parent.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (now: number) => {
      if (!running) return;
      const dayT = reduced ? 0.5 : ((now - started) / DAY_MS) % 1;
      if (visible) {
        drawScene(ctx, canvas.clientWidth, canvas.clientHeight, dayT, groundReady);
      }
      if (timeRef.current) timeRef.current.textContent = formatClock(dayT);
      if (phaseRef.current) phaseRef.current.textContent = formatPhase(dayT);
      raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(() => fit());
    ro.observe(canvas.parentElement ?? canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    fit();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      className="pl-sunstudy"
      role="img"
      aria-label="단지 조감도 일조 시뮬레이션. 해가 동쪽에서 떠 서쪽으로 지며 각 동의 햇살과 그림자가 바뀝니다."
    >
      <canvas ref={canvasRef} />
      <div className="pl-sunstudy__chrome">
        <span className="pl-sunstudy__time">
          <span ref={timeRef}>12:00</span>
          <em ref={phaseRef}>정오 · 남향 일조</em>
        </span>
        <ul className="pl-sunstudy__legend">
          <li>
            <i className="pl-sunstudy__swatch pl-sunstudy__swatch--sun" />
            일조면
          </li>
          <li>
            <i className="pl-sunstudy__swatch pl-sunstudy__swatch--shade" />
            그늘면
          </li>
        </ul>
      </div>
    </div>
  );
}
