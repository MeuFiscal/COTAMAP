type SectionHeadingProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
  inverted?: boolean;
}>;

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  inverted = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">
        {eyebrow}
      </p>
      <h2
        className={`text-balance text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl ${inverted ? "text-[#FFFFFF]" : "text-[#111827]"}`}
      >
        {title}
      </h2>
      <p
        className={`mt-5 text-pretty text-base leading-7 sm:text-lg ${inverted ? "text-[#FFFFFF]/70" : "text-[#111827]/70"}`}
      >
        {description}
      </p>
    </div>
  );
}
