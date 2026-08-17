import { PlMark } from "./PlMark";

export function PlLifestyle() {
  return (
    <section id="pl-section-lifestyle" className="pl-life">
      <div className="pl-container">
        <div className="pl-life__head">
          <p className="pl-kicker pl-kicker--light">
            <span />
            UNIT ORIENTATION
          </p>
          <h2 className="pl-display">
            하루를 바꾸는 <PlMark>작은 설계.</PlMark>
          </h2>
          <p>DETAILS / 03</p>
        </div>
        <div className="pl-life__grid">
          <article className="pl-life__wide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/life-light.jpg" alt="남향 거실로 들어오는 햇살" />
            <div className="pl-life__panel">
              <p>01 / LIGHT & AIR</p>
              <h3>빛이 머무는 집의 방향.</h3>
              <div className="pl-orient" aria-hidden>
                <svg viewBox="0 0 280 120" role="img">
                  <title>남향 배치와 맞통풍</title>
                  <circle cx="230" cy="28" r="16" fill="#c8eb4a" />
                  <text x="230" y="32" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1b1328">
                    남
                  </text>
                  <rect x="78" y="44" width="124" height="52" rx="8" fill="#fff" stroke="#1b1328" strokeWidth="1.5" />
                  <text x="140" y="68" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1b1328">
                    거실 · 주광
                  </text>
                  <text x="140" y="86" textAnchor="middle" fontSize="10" fill="#6b6575">
                    남향 창
                  </text>
                  <path d="M48 70 H74" stroke="#4e7014" strokeWidth="2" markerEnd="url(#arr)" />
                  <path d="M206 70 H232" stroke="#4e7014" strokeWidth="2" markerEnd="url(#arr)" />
                  <text x="28" y="66" fontSize="10" fill="#4e7014" fontWeight="700">
                    맞
                  </text>
                  <text x="28" y="78" fontSize="10" fill="#4e7014" fontWeight="700">
                    통풍
                  </text>
                  <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0 0 L6 3 L0 6 Z" fill="#4e7014" />
                    </marker>
                  </defs>
                </svg>
              </div>
              <small>
                분양에서 향은 카피가 아니라 평면 근거입니다. 남향 중심 거실과 맞통풍 개구부로, 계절 빛을 집 안에서 확인하게
                구성했습니다.
              </small>
            </div>
          </article>
          <article className="pl-life__dark">
            <p>02 / YOUR ROOM</p>
            <h3>나만의 집중과 회복을 위한 공간.</h3>
            <small>팬트리, 알파룸처럼 개인 수납·집중 공간을 타입 평면에 먼저 보여 줍니다.</small>
          </article>
          <article className="pl-life__plain">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/life-lounge.jpg" alt="입주민 라운지" />
            <div className="pl-life__panel pl-life__panel--plain">
              <p>03 / COMMON GROUND</p>
              <h3>함께여서 더 편안한 공용부.</h3>
              <small>
                위 갤러리의 커뮤니티는 피트니스·수영장 같은 시설 컷입니다. 공용부는 이웃과 머무는 생활 공간 — 라운지와
                작은 도서관입니다.
              </small>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
