import AppCard from "../components/common/AppCard";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="grid w-full max-w-[1680px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">MyPace</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          {title}
        </h1>
        <p className="m-0 text-[#66758c]">{description}</p>
      </header>
      <AppCard>
        <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">곧 연결할 화면이에요</h2>
        <p className="mb-0 text-[#66758c]">다음 단계에서 실제 API 데이터와 입력 폼을 붙일 예정이에요.</p>
      </AppCard>
    </div>
  );
}
