export function PlSmartHome() {
  return (
    <div className="pl-smarthome">
      <div className="pl-smarthome__photos">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/smart-wallpad.jpg" alt="현관 월패드와 밝은 거실" />
          <figcaption>세대 월패드</figcaption>
        </figure>
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/smart-parking.jpg" alt="전기차 충전과 빈자리가 보이는 지하 주차장" />
          <figcaption>지하 주차장</figcaption>
        </figure>
      </div>
      <ul className="pl-smarthome__list">
        <li>
          <b>월패드</b>
          <span>조명·난방·외출 모드를 현관에서 한 번에</span>
        </li>
        <li>
          <b>공기질</b>
          <span>미세먼지를 감지하면 환기가 자동으로</span>
        </li>
        <li>
          <b>주차유도</b>
          <span>빈자리까지 길을 안내합니다</span>
        </li>
        <li>
          <b>전기차 충전</b>
          <span>지하에 충전 구역을 따로 둡니다</span>
        </li>
      </ul>
    </div>
  );
}
