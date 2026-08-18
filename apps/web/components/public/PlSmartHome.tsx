export function PlSmartHome() {
  return (
    <svg
      className="pl-smarthome"
      viewBox="0 0 420 318"
      role="img"
      aria-label="세대 월패드와 지하 주차장이 하나의 시스템으로 연결된 단지 스마트홈. 조명·환기·대기전력, 주차 유도, 전기차 충전을 안내합니다."
    >
      <text className="pl-smarthome__kicker" x="16" y="18">
        세대 내부
      </text>
      <rect className="pl-smarthome__slab" x="12" y="26" width="396" height="148" rx="10" />

      <g className="pl-smarthome__pad">
        <rect x="28" y="46" width="78" height="108" rx="10" />
        <rect className="pl-smarthome__screen" x="38" y="58" width="58" height="70" rx="6" />
        <circle cx="67" cy="140" r="4" />
        <text x="67" y="86">
          월패드
        </text>
        <text className="pl-smarthome__sub" x="67" y="102">
          조명 · 난방
        </text>
      </g>

      <path className="pl-smarthome__wire" d="M106 86 H132" />
      <path className="pl-smarthome__wire" d="M106 108 H132" />
      <path className="pl-smarthome__wire" d="M106 130 H132" />

      <g className="pl-smarthome__node">
        <rect x="132" y="44" width="84" height="40" rx="8" />
        <text x="174" y="62">
          조명 제어
        </text>
        <text className="pl-smarthome__sub" x="174" y="76">
          외출 모드
        </text>
      </g>
      <g className="pl-smarthome__node pl-smarthome__node--hot">
        <rect x="132" y="90" width="84" height="40" rx="8" />
        <text x="174" y="108">
          공기질
        </text>
        <text className="pl-smarthome__sub" x="174" y="122">
          자동 환기
        </text>
      </g>
      <g className="pl-smarthome__node">
        <rect x="132" y="134" width="84" height="30" rx="8" />
        <text x="174" y="153">
          대기전력 차단
        </text>
      </g>

      <g className="pl-smarthome__room">
        <rect x="232" y="44" width="158" height="112" rx="8" />
        <rect className="pl-smarthome__window" x="248" y="58" width="52" height="36" rx="3" />
        <rect className="pl-smarthome__window" x="312" y="58" width="52" height="36" rx="3" />
        <circle className="pl-smarthome__sensor" cx="274" cy="76" r="5" />
        <circle className="pl-smarthome__sensor" cx="338" cy="76" r="5" />
        <rect className="pl-smarthome__furn" x="252" y="112" width="70" height="26" rx="4" />
        <rect className="pl-smarthome__furn" x="332" y="108" width="40" height="30" rx="4" />
        <text x="311" y="150">
          거실 센서 · 조명
        </text>
      </g>

      <text className="pl-smarthome__kicker" x="16" y="196">
        지하 주차장
      </text>
      <rect className="pl-smarthome__slab" x="12" y="204" width="396" height="100" rx="10" />
      <path className="pl-smarthome__ramp" d="M28 284 L58 220 H92 L62 284 Z" />
      <text className="pl-smarthome__sub" x="60" y="274">
        램프
      </text>
      <path className="pl-smarthome__guide" d="M88 252 H388" />

      {[0, 1, 2, 3, 4].map((i) => {
        const x = 108 + i * 56;
        const open = i === 2;
        const ev = i === 4;
        return (
          <g key={i} className={ev ? "pl-smarthome__stall pl-smarthome__stall--ev" : open ? "pl-smarthome__stall pl-smarthome__stall--open" : "pl-smarthome__stall"}>
            <rect x={x} y="220" width="48" height="68" rx="5" />
            <text x={x + 24} y="248">
              {ev ? "EV" : open ? "빈자리" : `${i + 1}`}
            </text>
            {ev ? (
              <path className="pl-smarthome__bolt" d={`M${x + 28} 256 L${x + 20} 268 H${x + 26} L${x + 18} 280`} />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
