export function PlRoomPlan() {
  return (
    <svg
      className="pl-roomplan"
      viewBox="0 0 420 260"
      role="img"
      aria-label="84제곱미터 타입 평면. 팬트리, 알파룸, 개인수납이 강조되어 있습니다."
    >
      <rect className="pl-roomplan__floor" x="12" y="12" width="396" height="236" rx="6" />
      <g className="pl-roomplan__room">
        <rect x="20" y="20" width="72" height="56" />
        <text x="56" y="52">
          현관
        </text>
      </g>
      <g className="pl-roomplan__hot">
        <rect x="92" y="20" width="64" height="56" />
        <text x="124" y="46">
          팬트리
        </text>
        <text className="pl-roomplan__no" x="124" y="62">
          01
        </text>
      </g>
      <g className="pl-roomplan__room">
        <rect x="156" y="20" width="52" height="56" />
        <text x="182" y="52">
          욕실
        </text>
      </g>
      <g className="pl-roomplan__hot">
        <rect x="208" y="20" width="90" height="56" />
        <text x="253" y="46">
          알파룸
        </text>
        <text className="pl-roomplan__no" x="253" y="62">
          02
        </text>
      </g>
      <g className="pl-roomplan__hot">
        <rect x="298" y="20" width="102" height="72" />
        <text x="349" y="52">
          개인수납
        </text>
        <text className="pl-roomplan__no" x="349" y="68">
          03
        </text>
      </g>
      <g className="pl-roomplan__room">
        <rect x="92" y="76" width="116" height="62" />
        <text x="150" y="112">
          침실 2
        </text>
      </g>
      <g className="pl-roomplan__room">
        <rect x="20" y="76" width="72" height="148" />
        <text x="56" y="154">
          주방
        </text>
      </g>
      <g className="pl-roomplan__room">
        <rect x="92" y="138" width="206" height="86" />
        <text x="195" y="178">
          거실 · 식당
        </text>
        <rect className="pl-roomplan__furn" x="132" y="188" width="86" height="22" rx="3" />
      </g>
      <g className="pl-roomplan__room">
        <rect x="298" y="92" width="102" height="132" />
        <text x="349" y="154">
          안방
        </text>
        <rect className="pl-roomplan__furn" x="322" y="168" width="54" height="36" rx="3" />
      </g>
      <rect className="pl-roomplan__balcony" x="20" y="224" width="278" height="16" />
      <text className="pl-roomplan__cap" x="159" y="236">
        남향 발코니
      </text>
      <text className="pl-roomplan__meta" x="400" y="248">
        84㎡ A
      </text>
    </svg>
  );
}
