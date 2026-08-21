import { PlMark } from "./PlMark";
import { PlSmartHome } from "./PlSmartHome";
import { PlSunStudy, type SunStudyConfig } from "./PlSunStudy";

export type LifestylePayload = {
  headline?: string;
  lightTitle?: string;
  lightBody?: string;
  smartTitle?: string;
  smartBody?: string;
  commonTitle?: string;
  commonBody?: string;
  spaces?: { url: string; caption: string }[];
  sunStudy?: SunStudyConfig;
};

const DEFAULT_SPACES = [
  { url: "/images/life-living.jpg", caption: "생활공간" },
  { url: "/images/life-lounge.jpg", caption: "라운지" },
  { url: "/images/life-library.jpg", caption: "작은도서관" },
];

export function PlLifestyle({ payload }: { payload?: LifestylePayload }) {
  const spaces = payload?.spaces?.length ? payload.spaces : DEFAULT_SPACES;

  return (
    <section id="pl-section-lifestyle" className="pl-life">
      <div className="pl-container">
        <div className="pl-life__head">
          <p className="pl-kicker pl-kicker--light">
            <span />
            UNIT ORIENTATION
          </p>
          <h2 className="pl-display">
            {payload?.headline ? (
              payload.headline
            ) : (
              <>
                하루를 바꾸는 <PlMark>작은 설계.</PlMark>
              </>
            )}
          </h2>
          <p>DETAILS / 03</p>
        </div>
        <div className="pl-life__grid">
          <article className="pl-life__wide">
            <PlSunStudy
              config={payload?.sunStudy}
              title={(payload?.lightTitle ?? "빛이 머무는 집의 방향").replace(/\.$/, "")}
            />
          </article>
          <article className="pl-life__soft">
            <p>02 / SMART HOME</p>
            <h3>{payload?.smartTitle ?? "집 안과 지하가 한 화면."}</h3>
            <small>
              {payload?.smartBody ??
                "월패드로 조명·환기·난방을 보고, 지하에서는 빈 자리와 전기차 충전을 안내합니다. 타입별 평면은 위에서 고르면 됩니다."}
            </small>
            <PlSmartHome />
          </article>
          <article className="pl-life__plain">
            <div className="pl-life__spaces">
              {spaces.map((s) => (
                <figure key={s.url + s.caption}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={s.caption} />
                  <figcaption>{s.caption}</figcaption>
                </figure>
              ))}
            </div>
            <div className="pl-life__panel pl-life__panel--plain">
              <p>03 / COMMON GROUND</p>
              <h3>{payload?.commonTitle ?? "함께여서 더 편안한 공용부."}</h3>
              <small>
                {payload?.commonBody ??
                  "이웃과 머무는 생활공간, 라운지, 작은 도서관 — 시설이 아니라 하루의 공용부입니다."}
              </small>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
