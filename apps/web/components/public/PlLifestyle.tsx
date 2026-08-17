import { PlMark } from "./PlMark";

export function PlLifestyle() {
  return (
    <section id="pl-section-lifestyle" className="pl-life">
      <div className="pl-container">
        <div className="pl-life__head">
          <p className="pl-kicker pl-kicker--light">
            <span />
            A SLOWER KIND OF LUXURY
          </p>
          <h2 className="pl-display">
            하루를 바꾸는 <PlMark>작은 설계.</PlMark>
          </h2>
          <p>DETAILS / 03</p>
        </div>
        <div className="pl-life__grid">
          <article className="pl-life__wide">
            <p>01 / LIGHT & AIR</p>
            <h3>빛이 머무는 집의 방향.</h3>
            <span className="pl-life__slab" aria-hidden />
            <small>남향 중심 배치와 맞통풍 구조로 계절의 변화를 집 안에서 느낍니다.</small>
          </article>
          <article className="pl-life__dark">
            <p>02 / YOUR ROOM</p>
            <h3>나만의 집중과 회복을 위한 공간.</h3>
            <small>팬트리, 알파룸, 라운지까지 생활의 밀도를 높이는 수납.</small>
          </article>
          <article className="pl-life__plain">
            <p>03 / COMMON GROUND</p>
            <h3>함께여서 더 편안한 공용부.</h3>
            <small>작은 도서관, 피트니스, 입주민 라운지.</small>
          </article>
        </div>
      </div>
    </section>
  );
}
