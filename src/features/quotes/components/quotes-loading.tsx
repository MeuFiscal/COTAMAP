export function QuotesLoading() {
  return (
    <div className="grid gap-5 lg:grid-cols-2" role="status" aria-label="Carregando cotações">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-[34rem] animate-pulse rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5"
        >
          <div className="h-44 rounded-2xl bg-[#F3F4F6]" />
          <div className="mt-5 h-12 rounded-xl bg-[#F3F4F6]" />
          <div className="mt-5 h-20 rounded-xl bg-[#F3F4F6]" />
          <div className="mt-5 h-14 rounded-xl bg-[#F3F4F6]" />
        </div>
      ))}
    </div>
  );
}
