const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function PriceHighlight({ value }: { value: number }) {
  const formatted = currencyFormatter.format(value);
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#111827]/40">
        Preço à vista
      </p>
      <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#111827] sm:text-4xl">
        {formatted}
      </p>
    </div>
  );
}
