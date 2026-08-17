"use client";

import { useEffect, useRef, useState } from "react";

type Dong = {
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  floors: number;
};

const ORTHO_SRC = "/images/sun-study-ortho.jpg";
const DAY_MS = 22000;
const HOUR_START = 8;
const HOUR_SPAN = 8;

const DONGS: Dong[] = [
  { name: "101동", x: -52, z: -46, w: 78, d: 14, h: 68, floors: 22 },
  { name: "102동", x: 48, z: -50, w: 82, d: 14, h: 74, floors: 24 },
  { name: "103동", x: -58, z: -8, w: 70, d: 14, h: 62, floors: 20 },
  { name: "104동", x: 54, z: -4, w: 74, d: 14, h: 66, floors: 21 },
  { name: "105동", x: -40, z: 34, w: 80, d: 14, h: 54, floors: 17 },
  { name: "106동", x: 50, z: 38, w: 68, d: 14, h: 50, floors: 16 },
];

const AMENITY: Dong = {
  name: "커뮤니티",
  x: 2,
  z: 12,
  w: 28,
  d: 20,
  h: 10,
  floors: 2,
};

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

export function PlSunStudy() {
  const hostRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const playingRef = useRef(true);
  const dayTRef = useRef(0.35);
  const [playing, setPlaying] = useState(true);

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
      scene.fog = new THREE.Fog(0x9eb7c9, 220, 520);

      const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 800);
      let camTheta = 0.22;
      let camPhi = 0.92;
      const camRadius = 205;
      const look = new THREE.Vector3(0, 16, 8);

      const placeCamera = () => {
        camera.position.set(
          Math.sin(camTheta) * Math.sin(camPhi) * camRadius,
          Math.cos(camPhi) * camRadius + 8,
          Math.cos(camTheta) * Math.sin(camPhi) * camRadius,
        );
        camera.lookAt(look);
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
      renderer.toneMappingExposure = 1.05;
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6b5a48, 0.55);
      scene.add(hemi);
      const fill = new THREE.AmbientLight(0xffffff, 0.18);
      scene.add(fill);

      const sunLight = new THREE.DirectionalLight(0xfff1d0, 2.2);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
      sunLight.shadow.bias = -0.00035;
      sunLight.shadow.normalBias = 0.035;
      const shadowSpan = 130;
      sunLight.shadow.camera.left = -shadowSpan;
      sunLight.shadow.camera.right = shadowSpan;
      sunLight.shadow.camera.top = shadowSpan;
      sunLight.shadow.camera.bottom = -shadowSpan;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 420;
      scene.add(sunLight);
      scene.add(sunLight.target);
      sunLight.target.position.set(0, 0, 0);

      const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(3.4, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfff4c8 }),
      );
      scene.add(sunMesh);

      const groundGeo = new THREE.PlaneGeometry(240, 180);
      const groundMat = new THREE.MeshLambertMaterial({ color: 0x7fa36a });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const texLoader = new THREE.TextureLoader();
      texLoader.load(ORTHO_SRC, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        groundMat.map = tex;
        groundMat.color.set(0xffffff);
        groundMat.needsUpdate = true;
      });

      const makeFacade = (floors: number, cols: number, dusk: boolean) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#d6cfc3";
        ctx.fillRect(0, 0, 512, 1024);
        ctx.fillStyle = "#c4bdb0";
        ctx.fillRect(0, 0, 512, 18);
        const rows = Math.max(6, floors);
        const c = Math.max(6, cols);
        for (let r = 0; r < rows; r += 1) {
          for (let col = 0; col < c; col += 1) {
            const x = 18 + col * ((512 - 36) / c);
            const y = 36 + r * ((980) / rows);
            const lit = dusk && (r * 11 + col * 5) % 5 === 0;
            ctx.fillStyle = lit ? "#f3d089" : "#2f3a48";
            ctx.fillRect(x, y, (512 - 36) / c - 7, 980 / rows - 10);
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
        ctx.fillStyle = "rgba(27,19,40,0.78)";
        ctx.beginPath();
        ctx.rect(8, 12, 240, 40);
        ctx.fill();
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
        sprite.scale.set(16, 4, 1);
        sprite.renderOrder = 2;
        return sprite;
      };

      const buildings: { mesh: import("three").Mesh; duskMaps: { day: import("three").Texture; night: import("three").Texture } }[] = [];

      const addBox = (b: Dong) => {
        const dayMap = makeFacade(b.floors, Math.round(b.w / 4.2), false);
        const nightMap = makeFacade(b.floors, Math.round(b.w / 4.2), true);
        const side = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          map: dayMap ?? undefined,
        });
        const cap = new THREE.MeshLambertMaterial({ color: 0xb7b1a6 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), [
          side,
          side.clone(),
          cap,
          new THREE.MeshLambertMaterial({ color: 0x8a8378 }),
          side.clone(),
          side.clone(),
        ]);
        mesh.position.set(b.x, b.h / 2, b.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 0.8, 1.1, b.d + 0.8),
          new THREE.MeshLambertMaterial({ color: 0xb7b1a6 }),
        );
        roof.position.set(b.x, b.h + 0.4, b.z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        scene.add(roof);
        const label = makeLabel(b.name);
        if (label) {
          label.position.set(b.x, b.h + 6, b.z);
          scene.add(label);
        }
        if (dayMap && nightMap) buildings.push({ mesh, duskMaps: { day: dayMap, night: nightMap } });
      };

      DONGS.forEach((b) => addBox(b));
      addBox(AMENITY);

      let duskApplied: boolean | null = null;
      const applySun = (t: number) => {
        const { azimuth, elevation } = sunPolar(t);
        const dist = 210;
        const x = Math.sin(azimuth) * Math.cos(elevation) * dist;
        const y = Math.sin(elevation) * dist;
        const z = -Math.cos(azimuth) * Math.cos(elevation) * dist;
        sunLight.position.set(x, y, z);
        sunMesh.position.set(x * 0.92, y * 0.92, z * 0.92);
        const warmth = 1 - Math.sin(t * Math.PI);
        sunLight.color.setRGB(1, 0.93 - warmth * 0.18, 0.78 - warmth * 0.28);
        sunLight.intensity = 1.15 + Math.sin(elevation) * 1.35;
        hemi.intensity = 0.28 + Math.sin(elevation) * 0.4;
        const sky = new THREE.Color().setHSL(0.58 - warmth * 0.08, 0.32, 0.62 - warmth * 0.22);
        scene.background = sky;
        scene.fog = new THREE.Fog(sky.getHex(), 220, 520);
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
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        host.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        camTheta -= (e.clientX - lastX) * 0.005;
        lastX = e.clientX;
      };
      const onUp = () => {
        dragging = false;
      };
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerup", onUp);

      raf = requestAnimationFrame(tick);

      return () => {
        host.removeEventListener("pointerdown", onDown);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerup", onUp);
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
      className="pl-sunstudy"
      role="img"
      aria-label="브이월드형 3D 일조 시뮬레이션. 동지일 기준 해가 동에서 서로 이동하며 각 동과 단지 바닥에 그림자가 집니다."
    >
      <div ref={hostRef} className="pl-sunstudy__stage" />
      <div className="pl-sunstudy__chrome">
        <span className="pl-sunstudy__time">
          <b>동지일</b>
          <span ref={timeRef}>10:48</span>
          <em ref={phaseRef}>남향 일조 · 고도 28°</em>
        </span>
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
      </div>
      <div className="pl-sunstudy__dock">
        <button
          type="button"
          className="pl-sunstudy__play"
          onClick={() => {
            playingRef.current = !playingRef.current;
            setPlaying(playingRef.current);
          }}
        >
          {playing ? "일시정지" : "재생"}
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
      </div>
    </div>
  );
}
