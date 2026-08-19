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
  facing: string;
};

const DAY_MS = 22000;
const HOUR_START = 8;
const HOUR_SPAN = 8;
const PHI_MIN = 0.18;
const PHI_MAX = 1.18;
const RADIUS_MIN = 360;
const RADIUS_MAX = 1100;
const HEIGHT_GAIN = 20 / 9;

const SITE_LATITUDE = 37.5665;
const SITE_LONGITUDE = 126.978;
const STANDARD_MERIDIAN = 135;
const WINTER_SOLSTICE_DAY = 356;
const SUN_LIGHT_DISTANCE = 900;
const SUN_DISC_DISTANCE = 313;
const SUN_DISC_RADIUS = 18;
const LABEL_SCALE = 90;

const COMPASS_POINTS = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"] as const;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function compassPoint(azimuthDeg: number) {
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(normalized / 45) % 8];
}

/**
 * A dong's front elevation looks along its local -Z, which after the yaw
 * rotation points back at the courtyard, so the facing azimuth is -yaw.
 */
function facingLabel(yaw: number) {
  return `${compassPoint(-toDeg(yaw))}향`;
}

const DONGS: Mass[] = (
  [
    { name: "101동", x: -86, z: -238, h: 78, floors: 26, kind: "why", spin: 0.12 },
    { name: "102동", x: -98, z: -128, h: 90, floors: 30, kind: "tee", spin: -0.08 },
    { name: "103동", x: -102, z: -16, h: 96, floors: 32, kind: "why", spin: 0.06 },
    { name: "104동", x: -96, z: 100, h: 84, floors: 28, kind: "tee", spin: -0.1 },
    { name: "105동", x: -78, z: 210, h: 72, floors: 24, kind: "why", spin: 0.08 },
    { name: "106동", x: 8, z: 258, h: 80, floors: 26, kind: "tee", spin: -0.06 },
    { name: "107동", x: 82, z: 202, h: 66, floors: 22, kind: "why", spin: 0.1 },
    { name: "108동", x: 100, z: 94, h: 75, floors: 25, kind: "tee", spin: -0.08 },
    { name: "109동", x: 102, z: -20, h: 88, floors: 29, kind: "why", spin: 0.06 },
    { name: "110동", x: 94, z: -130, h: 81, floors: 27, kind: "tee", spin: -0.1 },
    { name: "111동", x: 76, z: -236, h: 74, floors: 24, kind: "why", spin: 0.05 },
    { name: "112동", x: -6, z: -268, h: 70, floors: 23, kind: "tee", spin: -0.06 },
  ] as const
).map((d) => {
  const yaw = Math.atan2(d.x, d.z) + d.spin;
  return {
    name: d.name,
    x: d.x,
    z: d.z,
    h: d.h * HEIGHT_GAIN,
    floors: Math.round(d.floors * HEIGHT_GAIN),
    kind: d.kind,
    yaw,
    facing: facingLabel(yaw),
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

/** Cooper (1969) declination approximation. */
function solarDeclination(dayOfYear: number) {
  return toRad(23.45) * Math.sin(toRad((360 / 365) * (284 + dayOfYear)));
}

/** Equation of time in minutes, from the standard Spencer-style series. */
function equationOfTime(dayOfYear: number) {
  const b = toRad((360 / 364) * (dayOfYear - 81));
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * Solar altitude and azimuth for the site, from standard-clock hour.
 * Azimuth is measured clockwise from true north, matching the scene where
 * -Z is north and +X is east.
 */
function sunPosition(clockHour: number) {
  const declination = solarDeclination(WINTER_SOLSTICE_DAY);
  const minutesFromStandard = 4 * (SITE_LONGITUDE - STANDARD_MERIDIAN) + equationOfTime(WINTER_SOLSTICE_DAY);
  const solarHour = clockHour + minutesFromStandard / 60;
  const hourAngle = toRad(15 * (solarHour - 12));
  const latitude = toRad(SITE_LATITUDE);

  const sinAltitude = clamp(
    Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
    -1,
    1,
  );
  const altitude = Math.asin(sinAltitude);

  const cosAzimuth = clamp(
    (Math.sin(declination) - sinAltitude * Math.sin(latitude)) / (Math.cos(altitude) * Math.cos(latitude)),
    -1,
    1,
  );
  const azimuth = hourAngle > 0 ? 2 * Math.PI - Math.acos(cosAzimuth) : Math.acos(cosAzimuth);

  return { altitude, azimuth };
}

/**
 * Clear-sky direct beam fraction using Kasten-Young air mass and the
 * 0.7^(AM^0.678) attenuation model.
 */
function directBeamFraction(altitude: number) {
  if (altitude <= 0) return 0;
  const altitudeDeg = toDeg(altitude);
  const airMass = 1 / (Math.sin(altitude) + 0.50572 * Math.pow(altitudeDeg + 6.07995, -1.6364));
  return Math.pow(0.7, Math.pow(airMass, 0.678));
}

function formatPhase(altitude: number, azimuth: number) {
  const azimuthDeg = toDeg(azimuth);
  return `${compassPoint(azimuthDeg)} ${azimuthDeg.toFixed(0)}° · 고도 ${toDeg(altitude).toFixed(1)}°`;
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
  const orbitRef = useRef({ theta: 1.12, phi: 0.38, radius: 880 });
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
      const look = new THREE.Vector3(0, 4, 0);

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
        if (tiltRef.current) {
          if (document.activeElement !== tiltRef.current) {
            tiltRef.current.value = String(phi);
          }
          const fill = ((phi - PHI_MIN) / (PHI_MAX - PHI_MIN)) * 100;
          tiltRef.current.style.setProperty("--fill", `${fill.toFixed(2)}%`);
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
      const shadowSpan = 460;
      sunLight.shadow.camera.left = -shadowSpan;
      sunLight.shadow.camera.right = shadowSpan;
      sunLight.shadow.camera.top = shadowSpan;
      sunLight.shadow.camera.bottom = -shadowSpan;
      sunLight.shadow.camera.near = SUN_LIGHT_DISTANCE - shadowSpan;
      sunLight.shadow.camera.far = SUN_LIGHT_DISTANCE + shadowSpan;
      scene.add(sunLight);
      scene.add(sunLight.target);

      const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(SUN_DISC_RADIUS, 32, 32),
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

      const site = new THREE.Mesh(new THREE.CircleGeometry(250, 72), grass);
      site.rotation.x = -Math.PI / 2;
      site.scale.set(0.52, 1, 1.58);
      site.receiveShadow = true;
      scene.add(site);

      const hill = shadowed(new THREE.Mesh(new THREE.BoxGeometry(240, 14, 90), forestFloor));
      hill.position.set(-20, 5, -330);
      hill.rotation.z = 0.04;
      hill.rotation.x = -0.06;
      scene.add(hill);
      const hillW = shadowed(new THREE.Mesh(new THREE.BoxGeometry(70, 16, 420), forestFloor));
      hillW.position.set(-168, 6, -20);
      hillW.rotation.z = 0.08;
      scene.add(hillW);

      const southRoad = new THREE.Mesh(new THREE.PlaneGeometry(360, 28), asphalt);
      southRoad.rotation.x = -Math.PI / 2;
      southRoad.position.set(10, 0.04, 308);
      southRoad.receiveShadow = true;
      scene.add(southRoad);
      const eastRoad = new THREE.Mesh(new THREE.PlaneGeometry(28, 640), asphalt);
      eastRoad.rotation.x = -Math.PI / 2;
      eastRoad.position.set(158, 0.05, 8);
      eastRoad.receiveShadow = true;
      scene.add(eastRoad);

      for (let i = 0; i < 6; i += 1) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 12), white);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(142 + i * 2.4, 0.07, 308);
        scene.add(stripe);
      }

      const dropoff = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 0.35, 40), pathMat);
      dropoff.position.set(18, 0.2, 228);
      dropoff.scale.set(1.4, 1, 0.65);
      dropoff.receiveShadow = true;
      scene.add(dropoff);

      const lawnPad = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 0.28, 56), lawn);
      lawnPad.position.set(4, 0.16, 6);
      lawnPad.scale.set(0.48, 1, 1.85);
      lawnPad.receiveShadow = true;
      scene.add(lawnPad);

      const pondA = new THREE.Mesh(new THREE.CircleGeometry(22, 40), water);
      pondA.rotation.x = -Math.PI / 2;
      pondA.scale.set(0.85, 1, 1.55);
      pondA.position.set(4, 0.14, -62);
      pondA.receiveShadow = true;
      scene.add(pondA);
      const pondB = new THREE.Mesh(new THREE.CircleGeometry(12, 32), water);
      pondB.rotation.x = -Math.PI / 2;
      pondB.scale.set(0.9, 1, 1.35);
      pondB.position.set(-12, 0.15, -36);
      scene.add(pondB);

      const ring = new THREE.Mesh(new THREE.RingGeometry(54, 62, 56), pathMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.13;
      ring.scale.set(0.46, 1, 1.82);
      scene.add(ring);

      [
        [0, 0, 48, 4.2, 0],
        [0, 0, 4.2, 220, 0],
        [18, -72, 36, 3.2, 0.12],
        [-20, 64, 34, 3.2, -0.12],
        [22, 110, 32, 3, 0.18],
      ].forEach(([x, z, w, d, yaw]) => {
        const walk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), pathMat);
        walk.position.set(x, 0.12, z);
        walk.rotation.y = yaw;
        walk.receiveShadow = true;
        scene.add(walk);
      });

      const play = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.28, 28), sand);
      play.position.set(-32, 0.2, 96);
      play.receiveShadow = true;
      scene.add(play);
      const sport = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 12), court);
      sport.position.set(-48, 0.16, 122);
      sport.receiveShadow = true;
      scene.add(sport);
      [
        [-32, 96],
        [-28, 92],
        [-36, 102],
      ].forEach(([x, z], i) => {
        const kit = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6 + i * 0.4, 2.2), playAccent));
        kit.position.set(x, 1, z);
        scene.add(kit);
      });

      const pavilion = new THREE.Group();
      pavilion.position.set(-10, 0, 8);
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
      amenity.position.set(6, 0, 148);
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

      for (let i = 0; i < 90; i += 1) {
        const a = rnd() * Math.PI * 2;
        const r = 42 + rnd() * 78;
        addTree(Math.cos(a) * r * 0.42, Math.sin(a) * r * 1.55, 0.75 + rnd() * 0.65, rnd() > 0.5);
      }
      DONGS.forEach((dong, i) => {
        const next = DONGS[(i + 1) % DONGS.length];
        addTree((dong.x + next.x) * 0.5, (dong.z + next.z) * 0.5, 1.05 + rnd() * 0.35, rnd() > 0.42);
        addTree((dong.x + next.x) * 0.5 + 6, (dong.z + next.z) * 0.5 - 4, 0.85 + rnd() * 0.3, true);
      });
      for (let i = 0; i < 90; i += 1) {
        const x = -160 + rnd() * 180;
        const z = -350 + rnd() * 70;
        addTree(x, z, 1 + rnd() * 1.1, rnd() > 0.92, 5);
      }
      for (let i = 0; i < 70; i += 1) {
        addTree(-175 - rnd() * 28, -220 + rnd() * 420, 1.1 + rnd() * 0.9, false, 6);
      }

      for (let i = 0; i < 9; i += 1) {
        const hx = 178 + (i % 3) * 16;
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

      const makeLabel = (
        text: string,
        opts: { scale?: number; background?: string; color?: string } = {},
      ) => {
        const { scale = LABEL_SCALE, background = "rgba(27,19,40,0.86)", color = "#ffffff" } = opts;
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = background;
        ctx.fillRect(16, 24, 480, 80);
        ctx.fillStyle = color;
        ctx.font = "700 56px Pretendard, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 256, 66);
        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = 8;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }),
        );
        sprite.scale.set(scale, scale / 4, 1);
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
          label.position.set(b.x, b.h + 20, b.z);
          scene.add(label);
        }
        const facing = makeLabel(b.facing, {
          scale: LABEL_SCALE * 0.8,
          background: "rgba(200,235,74,0.92)",
          color: "#1b1328",
        });
        if (facing) {
          facing.position.set(b.x, b.h + 46, b.z);
          scene.add(facing);
        }
        scene.add(root);
      };

      DONGS.forEach(addDong);

      const amenityLabel = makeLabel("커뮤니티", { scale: 34 });
      if (amenityLabel) {
        amenityLabel.position.set(6, 16, 148);
        scene.add(amenityLabel);
      }

      const pinMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pinGeo = new THREE.CylinderGeometry(1.2, 1.2, 30, 8);
      const bearings: [string, number, number][] = [
        ["N 북", 0, -318],
        ["S 남", 0, 318],
        ["E 동", 186, 0],
        ["W 서", -186, 0],
      ];
      bearings.forEach(([text, bx, bz]) => {
        const marker = makeLabel(text, {
          scale: 66,
          background: "rgba(255,255,255,0.95)",
          color: "#1b1328",
        });
        if (!marker) return;
        marker.position.set(bx, 46, bz);
        scene.add(marker);

        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(bx, 15, bz);
        scene.add(pin);
      });

      let duskApplied: boolean | null = null;
      const applySun = (t: number) => {
        const { altitude, azimuth } = sunPosition(hourFromT(t));
        const horizontal = Math.cos(altitude);
        const dirX = Math.sin(azimuth) * horizontal;
        const dirY = Math.sin(altitude);
        const dirZ = -Math.cos(azimuth) * horizontal;
        sunLight.position.set(
          dirX * SUN_LIGHT_DISTANCE,
          dirY * SUN_LIGHT_DISTANCE,
          dirZ * SUN_LIGHT_DISTANCE,
        );
        sunMesh.position.set(dirX * SUN_DISC_DISTANCE, dirY * SUN_DISC_DISTANCE, dirZ * SUN_DISC_DISTANCE);

        const beam = directBeamFraction(altitude);
        const warmth = clamp(1 - toDeg(altitude) / 30, 0, 1);
        sunLight.color.setRGB(1, 0.93 - warmth * 0.2, 0.78 - warmth * 0.34);
        sunLight.intensity = 0.32 + beam * 3.4;
        hemi.intensity = 0.34 + Math.max(0, dirY) * 0.5;
        const sky = new THREE.Color().setHSL(0.58 - warmth * 0.08, 0.32, 0.64 - warmth * 0.22);
        scene.background = sky;
        scene.fog = new THREE.Fog(sky.getHex(), 560, 1480);
        renderer?.setClearColor(sky, 1);
        const dusk = toDeg(altitude) < 8;
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
        if (phaseRef.current) phaseRef.current.textContent = formatPhase(altitude, azimuth);
        if (sliderRef.current) {
          if (document.activeElement !== sliderRef.current) {
            sliderRef.current.value = String(t);
          }
          sliderRef.current.style.setProperty("--fill", `${(t * 100).toFixed(2)}%`);
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
      aria-label="서울 위도 기준 동지일 태양 궤도를 계산해 12개 동의 그림자를 재현한 3D 일조 시뮬레이션. 좌우 드래그는 동서 회전, 상하 드래그는 남북 각도입니다."
    >
      <div ref={hostRef} className="pl-sunstudy__stage" />
      <div className="pl-sunstudy__chrome">
        <span className="pl-sunstudy__time">
          <b>동지일 서울</b>
          <span ref={timeRef}>10:48</span>
          <em ref={phaseRef}>남 172° · 고도 28.5°</em>
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
              e.currentTarget.style.setProperty("--fill", `${(Number(e.target.value) * 100).toFixed(2)}%`);
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
            defaultValue={0.38}
            aria-label="남북 카메라 각도"
            onChange={(e) => {
              const phi = Number(e.target.value);
              orbitRef.current.phi = phi;
              const fill = ((phi - PHI_MIN) / (PHI_MAX - PHI_MIN)) * 100;
              e.currentTarget.style.setProperty("--fill", `${fill.toFixed(2)}%`);
            }}
          />
        </label>
      </div>
      <p className="pl-sunstudy__hint">
        좌우 드래그 동서 · 상하 드래그 남북 · 스크롤 거리 — 북위 37.57° 동지일 실제 태양 궤도 기준
      </p>
    </div>
  );
}
