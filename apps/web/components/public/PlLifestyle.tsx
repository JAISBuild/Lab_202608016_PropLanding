import { PlMark } from "./PlMark";
import { PlRoomPlan } from "./PlRoomPlan";
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
            <p>02 / YOUR ROOM</p>
            <h3>나만의 집중과 회복을 위한 공간.</h3>
            <small>팬트리·알파룸·개인수납을 타입 평면에 먼저 표시해, 수납과 집중 공간이 어디에 붙는지 바로 보이게 합니다.</small>
            <ul className="pl-life__tags">
              <li>01 팬트리</li>
              <li>02 알파룸</li>
              <li>03 개인수납</li>
            </ul>
            <PlRoomPlan />
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
