import { MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = Readonly<{
  children: ReactNode;
  title: string;
  description: string;
  wide?: boolean;
}>;

export function AuthShell({ children, title, description, wide = false }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F4F6] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[0.82fr_1.18fr] lg:p-0">
      <div className="pointer-events-none absolute -left-20 top-1/4 size-72 rounded-full bg-[#F97316]/10 blur-3xl" />
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#111827] p-12 text-[#FFFFFF] lg:flex">
        <div className="absolute -right-32 top-1/3 size-96 rounded-full border border-[#F97316]/30" />
        <Link
          href="/"
          className="relative inline-flex items-center gap-3 font-black tracking-[-0.04em]"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-[#F97316]">
            <MapPin className="size-6" aria-hidden="true" />
          </span>
          <span className="text-2xl">
            Cota<span className="text-[#F97316]">Map</span>
          </span>
        </Link>
        <div className="relative max-w-md">
          <p className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-[#F97316]">
            Cotações inteligentes
          </p>
          <p className="text-4xl font-black leading-tight tracking-[-0.04em]">
            Uma conta. Autopeças próximas. Até cinco cotações.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-[#FFFFFF]/70">
            <ShieldCheck className="size-5 text-[#F97316]" aria-hidden="true" />
            Sessão protegida pelo Supabase Auth
          </div>
        </div>
        <p className="relative text-xs text-[#FFFFFF]/45">© {new Date().getFullYear()} CotaMap</p>
      </aside>

      <section className="relative grid min-h-[calc(100vh-4rem)] place-items-center lg:min-h-screen">
        <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-black tracking-[-0.04em] lg:hidden"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-[#FFFFFF]">
              <MapPin className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xl">
              Cota<span className="text-[#F97316]">Map</span>
            </span>
          </Link>
          <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-6 shadow-[0_24px_70px_rgba(17,24,39,0.09)] sm:p-9">
            <header className="mb-7">
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#111827]">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-[#111827]/60">{description}</p>
            </header>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
