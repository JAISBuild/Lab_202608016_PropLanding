import { PlMark } from "./PlMark";
import { PlSmartHome } from "./PlSmartHome";
import { PlSunStudy } from "./PlSunStudy";

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
            <PlSunStudy />
            <div className="pl-life__panel">
              <p>01 / LIGHT & AIR</p>
              <h3>빛이 머무는 집의 방향.</h3>
              <small>
                동지일 기준, 해가 동에서 서로 지며 각 동과 단지 바닥에 그림자가 집니다. 전체화면에서 동서·남북 각도를
                바꿔 일조권과 비일조권을 동별로 비교하세요.
              </small>
            </div>
          </article>
          <article className="pl-life__dark">
            <p>02 / SMART HOME</p>
            <h3>집 안과 지하가 한 화면.</h3>
            <small>
              월패드로 조명·환기·난방을 보고, 지하에서는 빈 자리와 전기차 충전을 안내합니다. 타입별 평면은 위에서
              고르면 됩니다.
            </small>
            <ul className="pl-life__tags">
              <li>01 월패드</li>
              <li>02 공기질</li>
              <li>03 주차유도</li>
              <li>04 전기차 충전</li>
            </ul>
            <PlSmartHome />
          </article>
          <article className="pl-life__plain">
            <div className="pl-life__spaces">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/life-living.jpg" alt="이웃이 함께 앉는 커뮤니티 생활공간" />
                <figcaption>생활공간</figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/life-lounge.jpg" alt="커피를 마시며 머무는 입주민 라운지" />
                <figcaption>라운지</figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/life-library.jpg" alt="책장이 가득한 단지 작은도서관" />
                <figcaption>작은도서관</figcaption>
              </figure>
            </div>
            <div className="pl-life__panel pl-life__panel--plain">
              <p>03 / COMMON GROUND</p>
              <h3>함께여서 더 편안한 공용부.</h3>
              <small>이웃과 머무는 생활공간, 라운지, 작은 도서관 — 시설이 아니라 하루의 공용부입니다.</small>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
