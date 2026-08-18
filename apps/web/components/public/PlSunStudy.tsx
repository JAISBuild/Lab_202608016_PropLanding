"use client";

import { useEffect, useRef, useState } from "react";

type Kind = "why" | "tee";

type Mass = {
  name: string;
  x: number;
  z: number;
  h: number;
  floors: number;
  kind: Kind;
  yaw: number;
};

const DAY_MS = 22000;
const HOUR_START = 8;
const HOUR_SPAN = 8;
const PHI_MIN = 0.18;
const PHI_MAX = 1.18;
const RADIUS_MIN = 320;
const RADIUS_MAX = 880;

const DONGS: Mass[] = (
  [
    { name: "101동", deg: 12, r: 184, h: 78, floors: 26, kind: "why", spin: 0.16 },
    { name: "102동", deg: 41, r: 190, h: 90, floors: 30, kind: "tee", spin: -0.12 },
    { name: "103동", deg: 71, r: 182, h: 96, floors: 32, kind: "why", spin: 0.1 },
    { name: "104동", deg: 101, r: 188, h: 84, floors: 28, kind: "tee", spin: -0.14 },
    { name: "105동", deg: 131, r: 186, h: 72, floors: 24, kind: "why", spin: 0.08 },
    { name: "106동", deg: 162, r: 194, h: 80, floors: 26, kind: "tee", spin: -0.1 },
    { name: "107동", deg: 202, r: 196, h: 66, floors: 22, kind: "why", spin: 0.12 },
    { name: "108동", deg: 233, r: 188, h: 75, floors: 25, kind: "tee", spin: -0.08 },
    { name: "109동", deg: 263, r: 182, h: 88, floors: 29, kind: "why", spin: 0.1 },
    { name: "110동", deg: 293, r: 190, h: 81, floors: 27, kind: "tee", spin: -0.13 },
    { name: "111동", deg: 324, r: 184, h: 74, floors: 24, kind: "why", spin: 0.07 },
    { name: "112동", deg: 354, r: 180, h: 70, floors: 23, kind: "tee", spin: -0.09 },
  ] as const
).map((d) => {
  const rad = (d.deg * Math.PI) / 180;
  const x = Math.sin(rad) * d.r;
  const z = -Math.cos(rad) * d.r;
  return {
    name: d.name,
    x,
    z,
    h: d.h,
    floors: d.floors,
    kind: d.kind,
    yaw: Math.atan2(x, z) + d.spin,
  };
});

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function hourFromT(t: number) {
  return HOUR_START + t * HOUR_SPAN;
}

function formatClock(t: number) {
  const hour = hourFromT(t);
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function sunPolar(t: number) {
  const azimuth = ((90 + t * 180) * Math.PI) / 180;
  const elevation = Math.max(0.12, Math.sin(t * Math.PI) * 0.52);
  return { azimuth, elevation };
}

function formatPhase(t: number, elevation: number) {
  const deg = Math.round((elevation * 180) / Math.PI);
  if (t < 0.18) return `동향 일조 · 고도 ${deg}°`;
  if (t < 0.45) return `남동면 · 고도 ${deg}°`;
  if (t < 0.58) return `남향 일조 · 고도 ${deg}°`;
  if (t < 0.82) return `남서면 · 고도 ${deg}°`;
  return `서향 일조 · 고도 ${deg}°`;
}

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function PlSunStudy() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const tiltRef = useRef<HTMLInputElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(true);
  const dayTRef = useRef(0.35);
  const orbitRef = useRef({ theta: 0.62, phi: 0.4, radius: 660 });
  const [playing, setPlaying] = useState(true);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current;
    html.classList.toggle("pl-sun-full", full);
    if (full) {
      void root?.requestFullscreen?.().catch(() => undefined);
    } else if (document.fullscreenElement && root && document.fullscreenElement === root) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
    return () => html.classList.remove("pl-sun-full");
  }, [full]);

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setFull(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;

    const boot = async () => {
      const THREE = await import("three");
      if (disposed || !hostRef.current) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x9eb7c9, 560, 1480);

      const camera = new THREE.PerspectiveCamera(38, 1, 1.5, 2800);
      const look = new THREE.Vector3(6, 4, 10);

      const placeCamera = () => {
        const { theta, phi, radius } = orbitRef.current;
        camera.position.set(
          Math.sin(theta) * Math.sin(phi) * radius,
          Math.cos(phi) * radius + 16,
          Math.cos(theta) * Math.sin(phi) * radius,
        );
        camera.lookAt(look);
        if (compassRef.current) {
          compassRef.current.style.transform = `rotate(${theta}rad)`;
        }
        if (tiltRef.current && document.activeElement !== tiltRef.current) {
          tiltRef.current.value = String(phi);
        }
      };
      placeCamera();

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const hemi = new THREE.HemisphereLight(0xd7e8ff, 0x5d6a52, 0.62);
      scene.add(hemi);
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));

      const sunLight = new THREE.DirectionalLight(0xfff1d0, 2.25);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
      sunLight.shadow.bias = -0.00028;
      sunLight.shadow.normalBias = 0.036;
      const shadowSpan = 280;
      sunLight.shadow.camera.left = -shadowSpan;
      sunLight.shadow.camera.right = shadowSpan;
      sunLight.shadow.camera.top = shadowSpan;
      sunLight.shadow.camera.bottom = -shadowSpan;
      sunLight.shadow.camera.near = 16;
      sunLight.shadow.camera.far = 820;
      scene.add(sunLight);
      scene.add(sunLight.target);

      const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(3.6, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfff4c8 }),
      );
      scene.add(sunMesh);

      const shadowed = (mesh: import("three").Mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      };

      const grass = new THREE.MeshLambertMaterial({ color: 0x6f9a58 });
      const lawn = new THREE.MeshLambertMaterial({ color: 0x86b45f });
      const pathMat = new THREE.MeshLambertMaterial({ color: 0xd9cbb3 });
      const water = new THREE.MeshPhongMaterial({
        color: 0x8ec8d8,
        shininess: 42,
        specular: 0xb8e0ea,
      });
      const asphalt = new THREE.MeshLambertMaterial({ color: 0x4b5056 });
      const forestFloor = new THREE.MeshLambertMaterial({ color: 0x3d5a38 });
      const white = new THREE.MeshLambertMaterial({ color: 0xf2f5f8 });
      const glass = new THREE.MeshLambertMaterial({ color: 0x8aa0ac });
      const stone = new THREE.MeshLambertMaterial({ color: 0x8b969f });
      const roofHouse = new THREE.MeshLambertMaterial({ color: 0x8a8f93 });
      const wallHouse = new THREE.MeshLambertMaterial({ color: 0xd8d4cc });
      const bark = new THREE.MeshLambertMaterial({ color: 0x6a5340 });
      const leaf = new THREE.MeshLambertMaterial({ color: 0x4f7a3c });
      const blossom = new THREE.MeshLambertMaterial({ color: 0xe59ab3 });
      const sand = new THREE.MeshLambertMaterial({ color: 0xd8b57a });
      const court = new THREE.MeshLambertMaterial({ color: 0x3f7d5e });
      const playAccent = new THREE.MeshLambertMaterial({ color: 0xe07a5a });

      const site = new THREE.Mesh(new THREE.CircleGeometry(248, 72), grass);
      site.rotation.x = -Math.PI / 2;
      site.scale.set(1.1, 1, 1.04);
      site.receiveShadow = true;
      scene.add(site);

      const hill = shadowed(new THREE.Mesh(new THREE.BoxGeometry(300, 14, 78), forestFloor));
      hill.position.set(-40, 5, -248);
      hill.rotation.z = 0.04;
      hill.rotation.x = -0.06;
      scene.add(hill);
      const hillW = shadowed(new THREE.Mesh(new THREE.BoxGeometry(78, 16, 260), forestFloor));
      hillW.position.set(-248, 6, -20);
      hillW.rotation.z = 0.1;
      scene.add(hillW);

      const southRoad = new THREE.Mesh(new THREE.PlaneGeometry(560, 30), asphalt);
      southRoad.rotation.x = -Math.PI / 2;
      southRoad.position.set(30, 0.04, 248);
      southRoad.receiveShadow = true;
      scene.add(southRoad);
      const eastRoad = new THREE.Mesh(new THREE.PlaneGeometry(30, 500), asphalt);
      eastRoad.rotation.x = -Math.PI / 2;
      eastRoad.position.set(268, 0.05, 10);
      eastRoad.receiveShadow = true;
      scene.add(eastRoad);

      for (let i = 0; i < 6; i += 1) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 12), white);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(246 + i * 2.4, 0.07, 248);
        scene.add(stripe);
      }

      const dropoff = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 0.35, 40), pathMat);
      dropoff.position.set(72, 0.2, 168);
      dropoff.scale.set(1.55, 1, 0.7);
      dropoff.receiveShadow = true;
      scene.add(dropoff);

      const lawnPad = new THREE.Mesh(new THREE.CylinderGeometry(52, 52, 0.28, 56), lawn);
      lawnPad.position.set(22, 0.16, 8);
      lawnPad.receiveShadow = true;
      scene.add(lawnPad);

      const pondA = new THREE.Mesh(new THREE.CircleGeometry(28, 40), water);
      pondA.rotation.x = -Math.PI / 2;
      pondA.scale.set(1.55, 1, 0.8);
      pondA.position.set(4, 0.14, -32);
      pondA.receiveShadow = true;
      scene.add(pondA);
      const pondB = new THREE.Mesh(new THREE.CircleGeometry(16, 32), water);
      pondB.rotation.x = -Math.PI / 2;
      pondB.scale.set(1.25, 1, 0.9);
      pondB.position.set(-22, 0.15, -18);
      scene.add(pondB);

      const ring = new THREE.Mesh(new THREE.RingGeometry(70, 78, 56), pathMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.13;
      scene.add(ring);

      [
        [0, 0, 108, 4.4, 0],
        [0, 0, 4.4, 102, 0],
        [38, -42, 54, 3.4, 0.48],
        [-42, 36, 52, 3.4, -0.38],
        [52, 56, 44, 3.2, 0.68],
      ].forEach(([x, z, w, d, yaw]) => {
        const walk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), pathMat);
        walk.position.set(x, 0.12, z);
        walk.rotation.y = yaw;
        walk.receiveShadow = true;
        scene.add(walk);
      });

      const play = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 0.28, 28), sand);
      play.position.set(-62, 0.2, 62);
      play.receiveShadow = true;
      scene.add(play);
      const sport = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, 14), court);
      sport.position.set(-86, 0.16, 70);
      sport.receiveShadow = true;
      scene.add(sport);
      [
        [-62, 62],
        [-56, 58],
        [-68, 66],
      ].forEach(([x, z], i) => {
        const kit = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6 + i * 0.4, 2.2), playAccent));
        kit.position.set(x, 1, z);
        scene.add(kit);
      });

      const pavilion = new THREE.Group();
      pavilion.position.set(-14, 0, 6);
      const pavBase = shadowed(new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 16), stone));
      pavBase.position.y = 0.6;
      const pavPosts = [-5, 5].flatMap((px) =>
        [-5, 5].map((pz) => {
          const post = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.6, 0.7), new THREE.MeshLambertMaterial({ color: 0x4a3428 })));
          post.position.set(px, 3.5, pz);
          return post;
        }),
      );
      const pavRoof = shadowed(new THREE.Mesh(new THREE.ConeGeometry(13, 4.2, 4), new THREE.MeshLambertMaterial({ color: 0x2c2520 })));
      pavRoof.position.y = 7.2;
      pavRoof.rotation.y = Math.PI / 4;
      pavilion.add(pavBase, ...pavPosts, pavRoof);
      scene.add(pavilion);

      const amenity = new THREE.Group();
      amenity.position.set(12, 0, 96);
      amenity.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(28, 1, 16), stone)));
      amenity.children[0].position.y = 0.5;
      const hall = shadowed(new THREE.Mesh(new THREE.BoxGeometry(24, 5.2, 12), glass));
      hall.position.y = 3.6;
      amenity.add(hall);
      const roof = shadowed(new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 18), white));
      roof.position.y = 6.4;
      amenity.add(roof);
      scene.add(amenity);

      const rnd = seeded(42);
      const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 2.4, 6);
      const canopyGeo = new THREE.SphereGeometry(2.2, 8, 6);
      const addTree = (x: number, z: number, scale: number, pink: boolean, y = 0) => {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeo, bark);
        trunk.position.y = 1.2 * scale;
        trunk.scale.set(scale, scale, scale);
        trunk.castShadow = true;
        const cap = new THREE.Mesh(canopyGeo, pink ? blossom : leaf);
        cap.position.y = (2.8 + scale * 0.4) * scale;
        cap.scale.set(scale * 1.1, scale * 0.95, scale * 1.1);
        cap.castShadow = true;
        g.add(trunk, cap);
        g.position.set(x, y, z);
        scene.add(g);
      };

      for (let i = 0; i < 85; i += 1) {
        const a = rnd() * Math.PI * 2;
        const r = 54 + rnd() * 62;
        addTree(Math.cos(a) * r * 1.06, Math.sin(a) * r * 0.98, 0.75 + rnd() * 0.65, rnd() > 0.5);
      }
      for (let i = 0; i < 12; i += 1) {
        const gap = ((i + 0.5) * 30 * Math.PI) / 180;
        addTree(Math.sin(gap) * 168, -Math.cos(gap) * 168, 1.05 + rnd() * 0.35, rnd() > 0.42);
        addTree(Math.sin(gap + 0.035) * 176, -Math.cos(gap + 0.035) * 176, 0.85 + rnd() * 0.3, true);
      }
      for (let i = 0; i < 90; i += 1) {
        const x = -280 + rnd() * 240;
        const z = -280 + rnd() * 70;
        addTree(x, z, 1 + rnd() * 1.1, rnd() > 0.92, 5);
      }
      for (let i = 0; i < 55; i += 1) {
        addTree(-260 - rnd() * 36, -120 + rnd() * 220, 1.1 + rnd() * 0.9, false, 6);
      }

      for (let i = 0; i < 9; i += 1) {
        const hx = 292 + (i % 3) * 16;
        const hz = -40 + Math.floor(i / 3) * 24 + rnd() * 4;
        const house = shadowed(new THREE.Mesh(new THREE.BoxGeometry(8, 5.2, 7.2), wallHouse));
        house.position.set(hx, 2.6, hz);
        scene.add(house);
        const hroof = shadowed(new THREE.Mesh(new THREE.BoxGeometry(9, 1.1, 8.2), roofHouse));
        hroof.position.set(hx, 5.6, hz);
        scene.add(hroof);
      }

      const makeFacade = (floors: number, bays: number, dusk: boolean) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#9aa8b6";
        ctx.fillRect(0, 0, 512, 1024);
        ctx.fillStyle = "#e8eef3";
        ctx.fillRect(0, 0, 512, 22);
        ctx.fillRect(0, 1010, 512, 14);
        const rows = Math.max(12, floors);
        const cols = Math.max(6, bays);
        const top = 26;
        const rowH = (1024 - top - 12) / rows;
        const colW = (512 - 10) / cols;
        for (let c = 0; c < cols; c += 1) {
          if (c % 4 === 0) {
            ctx.fillStyle = "rgba(244,247,250,0.92)";
            ctx.fillRect(6 + c * colW - 3, 0, 5, 1024);
          }
        }
        for (let r = 0; r < rows; r += 1) {
          if (r % 5 === 0) {
            ctx.fillStyle = "rgba(232,238,243,0.7)";
            ctx.fillRect(0, top + r * rowH - 1, 512, 3);
          }
          for (let c = 0; c < cols; c += 1) {
            const x = 7 + c * colW;
            const y = top + r * rowH + 2;
            const gw = colW - 4.5;
            const gh = rowH - 5;
            const lit = dusk && (r * 11 + c * 5) % 7 === 0;
            ctx.fillStyle = lit ? "#efc56f" : "#1e2a32";
            ctx.fillRect(x, y, gw, gh * 0.72);
            ctx.fillStyle = "rgba(244,247,250,0.28)";
            ctx.fillRect(x, y + gh * 0.72, gw, gh * 0.18);
          }
        }
        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = 8;
        return map;
      };

      const makeLabel = (text: string) => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "rgba(27,19,40,0.82)";
        ctx.fillRect(8, 12, 240, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 28px Pretendard, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 128, 32);
        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }),
        );
        sprite.scale.set(18, 4.5, 1);
        sprite.renderOrder = 2;
        return sprite;
      };

      type LitMesh = {
        mesh: import("three").Mesh;
        duskMaps: { day: import("three").Texture; night: import("three").Texture };
      };
      const buildings: LitMesh[] = [];
      const facadeCache = new Map<string, { day: import("three").Texture; night: import("three").Texture }>();

      const facadePair = (floors: number, bays: number) => {
        const key = `${floors}:${bays}`;
        const hit = facadeCache.get(key);
        if (hit) return hit;
        const day = makeFacade(floors, bays, false);
        const night = makeFacade(floors, bays, true);
        if (!day || !night) return null;
        const pair = { day, night };
        facadeCache.set(key, pair);
        return pair;
      };

      const sideMats = (map: import("three").Texture | null) => {
        const side = new THREE.MeshLambertMaterial({ color: 0xffffff, map: map ?? undefined });
        return [
          side,
          side.clone(),
          new THREE.MeshLambertMaterial({ color: 0xf2f5f8 }),
          new THREE.MeshLambertMaterial({ color: 0x7d868e }),
          side.clone(),
          side.clone(),
        ];
      };

      const addVolume = (
        root: import("three").Group,
        lx: number,
        lz: number,
        w: number,
        d: number,
        h: number,
        floors: number,
      ) => {
        const bays = Math.max(6, Math.round(Math.max(w, d) / 3.4));
        const maps = facadePair(floors, bays);
        const mesh = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sideMats(maps?.day ?? null)));
        mesh.position.set(lx, h / 2, lz);
        root.add(mesh);
        if (maps) buildings.push({ mesh, duskMaps: maps });

        const podium = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w + 1.4, 2.8, d + 1.2), stone));
        podium.position.set(lx, 1.4, lz);
        root.add(podium);

        const crown = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w + 0.9, 0.85, d + 0.9), white));
        crown.position.set(lx, h + 0.3, lz);
        root.add(crown);

        const penthouse = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, 3.6, d * 0.48), white));
        penthouse.position.set(lx + w * 0.06, h + 2.2, lz);
        root.add(penthouse);

        const finW = 0.7;
        const finH = h * 0.96;
        [
          [w / 2 + 0.15, d / 2 - 1.2],
          [-w / 2 - 0.15, -d / 2 + 1.2],
        ].forEach(([fx, fz]) => {
          const fin = shadowed(new THREE.Mesh(new THREE.BoxGeometry(finW, finH, 1.6), white));
          fin.position.set(lx + fx, finH / 2, lz + fz);
          root.add(fin);
        });
      };

      const addDong = (b: Mass) => {
        const root = new THREE.Group();
        root.position.set(b.x, 0, b.z);
        root.rotation.y = b.yaw;
        if (b.kind === "tee") {
          addVolume(root, 0, 0, 34, 13, b.h, b.floors);
          addVolume(root, 0, -17, 13, 28, b.h * 0.95, Math.max(18, b.floors - 2));
        } else {
          addVolume(root, 0, -13, 12, 24, b.h, b.floors);
          addVolume(root, -15, 9, 22, 12, b.h * 0.96, Math.max(18, b.floors - 2));
          addVolume(root, 15, 9, 22, 12, b.h * 0.96, Math.max(18, b.floors - 2));
        }
        const label = makeLabel(b.name);
        if (label) {
          label.position.set(b.x, b.h + 12, b.z);
          scene.add(label);
        }
        scene.add(root);
      };

      DONGS.forEach(addDong);

      const amenityLabel = makeLabel("커뮤니티");
      if (amenityLabel) {
        amenityLabel.position.set(12, 14, 96);
        scene.add(amenityLabel);
      }

      let duskApplied: boolean | null = null;
      const applySun = (t: number) => {
        const { azimuth, elevation } = sunPolar(t);
        const dist = 340;
        const x = Math.sin(azimuth) * Math.cos(elevation) * dist;
        const y = Math.sin(elevation) * dist;
        const z = -Math.cos(azimuth) * Math.cos(elevation) * dist;
        sunLight.position.set(x, y, z);
        sunMesh.position.set(x * 0.92, y * 0.92, z * 0.92);
        const warmth = 1 - Math.sin(t * Math.PI);
        sunLight.color.setRGB(1, 0.93 - warmth * 0.18, 0.78 - warmth * 0.28);
        sunLight.intensity = 1.15 + Math.sin(elevation) * 1.35;
        hemi.intensity = 0.3 + Math.sin(elevation) * 0.4;
        const sky = new THREE.Color().setHSL(0.58 - warmth * 0.08, 0.32, 0.64 - warmth * 0.22);
        scene.background = sky;
        scene.fog = new THREE.Fog(sky.getHex(), 560, 1480);
        renderer?.setClearColor(sky, 1);
        const dusk = t > 0.82 || t < 0.1;
        if (duskApplied !== dusk) {
          duskApplied = dusk;
          for (const item of buildings) {
            const mats = item.mesh.material as import("three").MeshLambertMaterial[];
            for (const mat of mats) {
              if (!mat.map) continue;
              mat.map = dusk ? item.duskMaps.night : item.duskMaps.day;
              mat.emissive.set(dusk ? 0x1a140c : 0x000000);
              mat.needsUpdate = true;
            }
          }
        }
        if (timeRef.current) timeRef.current.textContent = formatClock(t);
        if (phaseRef.current) phaseRef.current.textContent = formatPhase(t, elevation);
        if (sliderRef.current && document.activeElement !== sliderRef.current) {
          sliderRef.current.value = String(t);
        }
      };

      const fit = () => {
        const w = Math.max(1, host.clientWidth);
        const h = Math.max(1, host.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer?.setSize(w, h, false);
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      playingRef.current = !reduced;
      if (reduced) {
        dayTRef.current = 0.5;
        setPlaying(false);
      }

      let last = performance.now();
      let visible = true;
      applySun(dayTRef.current);
      fit();

      const tick = (now: number) => {
        if (disposed) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (playingRef.current && visible && !reduced) {
          dayTRef.current = (dayTRef.current + (dt * 1000) / DAY_MS) % 1;
        }
        applySun(dayTRef.current);
        placeCamera();
        renderer?.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };

      const ro = new ResizeObserver(fit);
      ro.observe(host);
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(host);

      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const onDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest("button, input, label")) return;
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        host.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        orbitRef.current.theta -= (e.clientX - lastX) * 0.005;
        orbitRef.current.phi = clamp(orbitRef.current.phi - (e.clientY - lastY) * 0.0048, PHI_MIN, PHI_MAX);
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onUp = () => {
        dragging = false;
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        orbitRef.current.radius = clamp(orbitRef.current.radius + e.deltaY * 0.16, RADIUS_MIN, RADIUS_MAX);
      };
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerup", onUp);
      host.addEventListener("wheel", onWheel, { passive: false });

      raf = requestAnimationFrame(tick);

      return () => {
        host.removeEventListener("pointerdown", onDown);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerup", onUp);
        host.removeEventListener("wheel", onWheel);
        ro.disconnect();
        io.disconnect();
        scene.traverse((obj) => {
          const mesh = obj as import("three").Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as import("three").Material | import("three").Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        });
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    };

    let cleanupInner: (() => void) | undefined;
    void boot().then((fn) => {
      if (!fn) return;
      if (disposed) fn();
      else cleanupInner = fn;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanupInner?.();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`pl-sunstudy${full ? " is-full" : ""}`}
      role="img"
      aria-label="12개 동이 한 동 너비 이상 떨어져 넓은 중정 공원을 둘러싼 단지 3D 일조 시뮬레이션. 좌우 드래그는 동서 회전, 상하 드래그는 남북 각도입니다."
    >
      <div ref={hostRef} className="pl-sunstudy__stage" />
      <div className="pl-sunstudy__chrome">
        <span className="pl-sunstudy__time">
          <b>동지일</b>
          <span ref={timeRef}>10:48</span>
          <em ref={phaseRef}>남향 일조 · 고도 28°</em>
        </span>
        <div className="pl-sunstudy__tools">
          <div ref={compassRef} className="pl-sunstudy__compass" aria-hidden="true">
            <span>N</span>
          </div>
          <ul className="pl-sunstudy__legend">
            <li>
              <i className="pl-sunstudy__swatch pl-sunstudy__swatch--sun" />
              일조면
            </li>
            <li>
              <i className="pl-sunstudy__swatch pl-sunstudy__swatch--shade" />
              그림자
            </li>
          </ul>
          <button
            type="button"
            className="pl-sunstudy__fs"
            aria-pressed={full}
            onClick={() => setFull((v) => !v)}
          >
            {full ? "닫기" : "전체화면"}
          </button>
        </div>
      </div>
      <div className="pl-sunstudy__dock">
        <button
          type="button"
          className="pl-sunstudy__play"
          aria-label={playing ? "일시정지" : "재생"}
          onClick={() => {
            playingRef.current = !playingRef.current;
            setPlaying(playingRef.current);
          }}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 5h3.2v14H7V5zm6.8 0H17v14h-3.2V5z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.2v13.6L19 12 8 5.2z" />
            </svg>
          )}
        </button>
        <label className="pl-sunstudy__slider">
          <span>08시</span>
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={1}
            step={0.002}
            defaultValue={0.35}
            aria-label="동지일 시각"
            onPointerDown={() => {
              playingRef.current = false;
              setPlaying(false);
            }}
            onChange={(e) => {
              dayTRef.current = Number(e.target.value);
            }}
          />
          <span>16시</span>
        </label>
        <label className="pl-sunstudy__tilt">
          <span>남북</span>
          <input
            ref={tiltRef}
            type="range"
            min={PHI_MIN}
            max={PHI_MAX}
            step={0.01}
            defaultValue={0.4}
            aria-label="남북 카메라 각도"
            onChange={(e) => {
              orbitRef.current.phi = Number(e.target.value);
            }}
          />
        </label>
      </div>
      <p className="pl-sunstudy__hint">좌우 드래그 동서 · 상하 드래그 남북 · 스크롤 거리</p>
    </div>
  );
}
