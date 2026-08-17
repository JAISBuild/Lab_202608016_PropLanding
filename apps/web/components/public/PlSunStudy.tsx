"use client";

import { useEffect, useRef, useState } from "react";

type Tone = "ivory" | "warm";

type Mass = {
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  floors: number;
  yaw: number;
  kind: "plate" | "tower" | "ell";
  tone: Tone;
  wing?: { w: number; d: number };
};

const ORTHO_SRC = "/images/sun-study-ortho.jpg";
const DAY_MS = 22000;
const HOUR_START = 8;
const HOUR_SPAN = 8;
const PHI_MIN = 0.22;
const PHI_MAX = 1.28;
const RADIUS_MIN = 108;
const RADIUS_MAX = 360;

const DONGS: Mass[] = [
  {
    name: "101동",
    x: -46,
    z: -40,
    w: 58,
    d: 13.5,
    h: 74,
    floors: 25,
    yaw: 0.22,
    kind: "ell",
    tone: "ivory",
    wing: { w: 13.5, d: 34 },
  },
  {
    name: "102동",
    x: 48,
    z: -42,
    w: 21,
    d: 23,
    h: 96,
    floors: 34,
    yaw: -0.38,
    kind: "tower",
    tone: "warm",
  },
  {
    name: "103동",
    x: -58,
    z: 6,
    w: 64,
    d: 13,
    h: 66,
    floors: 22,
    yaw: 1.52,
    kind: "plate",
    tone: "ivory",
  },
  {
    name: "104동",
    x: 54,
    z: 4,
    w: 56,
    d: 13,
    h: 78,
    floors: 26,
    yaw: -1.46,
    kind: "plate",
    tone: "warm",
  },
  {
    name: "105동",
    x: -36,
    z: 44,
    w: 76,
    d: 13.5,
    h: 58,
    floors: 19,
    yaw: 0.06,
    kind: "plate",
    tone: "ivory",
  },
  {
    name: "106동",
    x: 46,
    z: 42,
    w: 20,
    d: 24,
    h: 84,
    floors: 29,
    yaw: 0.48,
    kind: "tower",
    tone: "warm",
  },
];

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
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const tiltRef = useRef<HTMLInputElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(true);
  const dayTRef = useRef(0.35);
  const orbitRef = useRef({ theta: 0.34, phi: 0.9, radius: 198 });
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
      scene.fog = new THREE.Fog(0x9eb7c9, 240, 560);

      const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 900);
      const look = new THREE.Vector3(0, 18, 6);

      const placeCamera = () => {
        const { theta, phi, radius } = orbitRef.current;
        camera.position.set(
          Math.sin(theta) * Math.sin(phi) * radius,
          Math.cos(phi) * radius + 10,
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
      renderer.toneMappingExposure = 1.08;
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const hemi = new THREE.HemisphereLight(0xd7e8ff, 0x6d5c4c, 0.58);
      scene.add(hemi);
      scene.add(new THREE.AmbientLight(0xffffff, 0.2));

      const sunLight = new THREE.DirectionalLight(0xfff1d0, 2.2);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
      sunLight.shadow.bias = -0.00032;
      sunLight.shadow.normalBias = 0.032;
      const shadowSpan = 140;
      sunLight.shadow.camera.left = -shadowSpan;
      sunLight.shadow.camera.right = shadowSpan;
      sunLight.shadow.camera.top = shadowSpan;
      sunLight.shadow.camera.bottom = -shadowSpan;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 460;
      scene.add(sunLight);
      scene.add(sunLight.target);

      const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(3.4, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfff4c8 }),
      );
      scene.add(sunMesh);

      const groundMat = new THREE.MeshLambertMaterial({ color: 0x7fa36a });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 180), groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      new THREE.TextureLoader().load(ORTHO_SRC, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        groundMat.map = tex;
        groundMat.color.set(0xffffff);
        groundMat.needsUpdate = true;
      });

      const plaza = new THREE.Mesh(
        new THREE.CylinderGeometry(17, 17, 0.4, 48),
        new THREE.MeshLambertMaterial({ color: 0xe6dfd2 }),
      );
      plaza.position.set(2, 0.22, 2);
      plaza.receiveShadow = true;
      scene.add(plaza);

      const makeFacade = (floors: number, bays: number, dusk: boolean, tone: Tone) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const body = tone === "warm" ? "#e7d8c6" : "#eee8de";
        const band = tone === "warm" ? "#d7c6b0" : "#ddd4c6";
        ctx.fillStyle = body;
        ctx.fillRect(0, 0, 512, 1024);
        ctx.fillStyle = band;
        ctx.fillRect(0, 0, 512, 26);
        const rows = Math.max(10, floors);
        const cols = Math.max(5, bays);
        const top = 30;
        const rowH = (1024 - top - 10) / rows;
        const colW = (512 - 14) / cols;
        for (let r = 0; r < rows; r += 1) {
          if (r % 4 === 0) {
            ctx.fillStyle = band;
            ctx.fillRect(0, top + r * rowH - 2, 512, 5);
          }
          for (let c = 0; c < cols; c += 1) {
            const x = 8 + c * colW;
            const y = top + r * rowH + 3;
            const gw = colW - 5;
            const gh = rowH - 7;
            ctx.fillStyle = "rgba(255,255,255,0.38)";
            ctx.fillRect(x, y + gh * 0.66, gw, gh * 0.2);
            const lit = dusk && (r * 13 + c * 7) % 6 === 0;
            ctx.fillStyle = lit ? "#efc56f" : "#243039";
            ctx.fillRect(x + 1, y, gw - 2, gh * 0.6);
            ctx.fillStyle = "rgba(92, 68, 48, 0.32)";
            ctx.fillRect(x + gw * 0.48, y, 1.4, gh * 0.6);
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
        sprite.scale.set(15, 3.8, 1);
        sprite.renderOrder = 2;
        return sprite;
      };

      const shadowed = (mesh: import("three").Mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      };

      type LitMesh = {
        mesh: import("three").Mesh;
        duskMaps: { day: import("three").Texture; night: import("three").Texture };
      };
      const buildings: LitMesh[] = [];

      const sideMats = (map: import("three").Texture | null, cap: number, soffit: number) => {
        const side = new THREE.MeshLambertMaterial({ color: 0xffffff, map: map ?? undefined });
        return [
          side,
          side.clone(),
          new THREE.MeshLambertMaterial({ color: cap }),
          new THREE.MeshLambertMaterial({ color: soffit }),
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
        tone: Tone,
        balcony: boolean,
      ) => {
        const bays = Math.max(5, Math.round(Math.max(w, d) / 3.6));
        const dayMap = makeFacade(floors, bays, false, tone);
        const nightMap = makeFacade(floors, bays, true, tone);
        const cap = tone === "warm" ? 0xcfc0ae : 0xd8d1c6;
        const mesh = shadowed(
          new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sideMats(dayMap, cap, 0x8f877c)),
        );
        mesh.position.set(lx, h / 2, lz);
        root.add(mesh);
        if (dayMap && nightMap) buildings.push({ mesh, duskMaps: { day: dayMap, night: nightMap } });

        const podium = shadowed(
          new THREE.Mesh(
            new THREE.BoxGeometry(w + 1.6, 3.2, d + 1.3),
            new THREE.MeshLambertMaterial({ color: tone === "warm" ? 0xc3b39f : 0xd2cbc0 }),
          ),
        );
        podium.position.set(lx, 1.6, lz);
        root.add(podium);

        if (balcony) {
          const slab = shadowed(
            new THREE.Mesh(
              new THREE.BoxGeometry(w * 0.9, h * 0.86, 1.05),
              new THREE.MeshLambertMaterial({ color: 0xd5dce2 }),
            ),
          );
          slab.position.set(lx, h * 0.48, lz + d / 2 + 0.42);
          root.add(slab);
        }

        const penthouse = shadowed(
          new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.4, 3.4, d * 0.52),
            new THREE.MeshLambertMaterial({ color: cap }),
          ),
        );
        penthouse.position.set(lx + w * 0.08, h + 1.9, lz);
        root.add(penthouse);
        const crown = shadowed(
          new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.6, 0.7, d + 0.6),
            new THREE.MeshLambertMaterial({ color: 0xb7b0a6 }),
          ),
        );
        crown.position.set(lx, h + 0.25, lz);
        root.add(crown);
      };

      const addDong = (b: Mass) => {
        const root = new THREE.Group();
        root.position.set(b.x, 0, b.z);
        root.rotation.y = b.yaw;
        if (b.kind === "tower") {
          addVolume(root, 0, 0, b.w, b.d, b.h, b.floors, b.tone, false);
          const fin = shadowed(
            new THREE.Mesh(
              new THREE.BoxGeometry(1.1, b.h * 0.92, b.d * 0.28),
              new THREE.MeshLambertMaterial({ color: 0x8d7358 }),
            ),
          );
          fin.position.set(b.w / 2 + 0.3, b.h * 0.48, -b.d * 0.18);
          root.add(fin);
        } else {
          addVolume(root, 0, 0, b.w, b.d, b.h, b.floors, b.tone, true);
          if (b.kind === "ell" && b.wing) {
            const ox = -b.w / 2 + b.wing.w / 2;
            const oz = b.d / 2 + b.wing.d / 2;
            addVolume(root, ox, oz, b.wing.w, b.wing.d, b.h * 0.9, Math.max(16, b.floors - 3), b.tone, true);
          }
        }
        const label = makeLabel(b.name);
        if (label) {
          label.position.set(b.x, b.h + 8, b.z);
          scene.add(label);
        }
        scene.add(root);
      };

      DONGS.forEach(addDong);

      const amenity = new THREE.Group();
      amenity.position.set(2, 0, 14);
      const glass = new THREE.MeshLambertMaterial({ color: 0x9eb0b8 });
      const stone = new THREE.MeshLambertMaterial({ color: 0xe4ddd1 });
      const canopy = new THREE.MeshLambertMaterial({ color: 0xf3eee6 });
      const amenityBase = shadowed(new THREE.Mesh(new THREE.BoxGeometry(34, 1.1, 24), stone));
      amenityBase.position.set(0, 0.55, 0);
      const amenityHall = shadowed(new THREE.Mesh(new THREE.BoxGeometry(30, 6.4, 20), glass));
      amenityHall.position.set(0, 4.3, 0);
      const amenityRoof = shadowed(new THREE.Mesh(new THREE.BoxGeometry(40, 0.45, 28), canopy));
      amenityRoof.position.set(0, 7.7, 0);
      amenity.add(amenityBase, amenityHall, amenityRoof);
      const pool = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.18, 8),
        new THREE.MeshLambertMaterial({ color: 0x6a9bb0 }),
      );
      pool.position.set(18, 0.2, 4);
      pool.receiveShadow = true;
      amenity.add(pool);
      const amenityLabel = makeLabel("커뮤니티");
      if (amenityLabel) {
        amenityLabel.position.set(0, 12, 0);
        amenity.add(amenityLabel);
      }
      scene.add(amenity);

      const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x5f7a4c });
      [
        [-18, -8],
        [22, -10],
        [-14, 22],
        [16, 24],
      ].forEach(([x, z]) => {
        const hedge = shadowed(new THREE.Mesh(new THREE.BoxGeometry(8, 2.2, 2.4), hedgeMat));
        hedge.position.set(x, 1.1, z);
        scene.add(hedge);
      });

      let duskApplied: boolean | null = null;
      const applySun = (t: number) => {
        const { azimuth, elevation } = sunPolar(t);
        const dist = 220;
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
        scene.fog = new THREE.Fog(sky.getHex(), 240, 560);
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
        orbitRef.current.radius = clamp(orbitRef.current.radius + e.deltaY * 0.14, RADIUS_MIN, RADIUS_MAX);
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
      aria-label="2026 신축형 단지 3D 일조 시뮬레이션. 좌우 드래그는 동서 회전, 상하 드래그는 남북 각도, 전체화면에서 동별 일조·그림자를 볼 수 있습니다."
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
            defaultValue={0.9}
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
