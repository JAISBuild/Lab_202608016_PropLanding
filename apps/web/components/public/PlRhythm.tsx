import { PlMark } from "./PlMark";

export function PlRhythm() {
  return (
    <section className="pl-rhythm" aria-labelledby="pl-rhythm-title">
      <div className="pl-container">
        <div className="pl-rhythm__top">
          <div>
            <p className="pl-kicker pl-kicker--light">
              <span />
              THE EVERYDAY, REBALANCED.
            </p>
            <h2 id="pl-rhythm-title" className="pl-display">
              가까운 것이 <PlMark>더 좋은</PlMark> 이유.
            </h2>
          </div>
          <p className="pl-rhythm__lead">
            빛, 동선, 하루의 리듬이 먼저입니다. 분양 정보를 나열하기보다, 실제로 머무를 공간의 결을 천천히 보여 드립니다.
          </p>
        </div>
        <div className="pl-rhythm__stats">
          <div>
            <p>
              <strong>3</strong>
              <span>개의 결</span>
            </p>
            <small>서로 다른 생활 타입</small>
          </div>
          <div>
            <p>
              <strong>24</strong>
              <span>시간</span>
            </p>
            <small>내 리듬에 맞춘 공간</small>
          </div>
          <div>
            <p>
              <strong>01</strong>
              <span>개의 원칙</span>
            </p>
            <small>덜어낼수록 선명해지는 집</small>
          </div>
        </div>
      </div>
    </section>
  );
}
