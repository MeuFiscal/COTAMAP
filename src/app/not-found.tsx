import { MapPinOff } from "lucide-react";
import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F3F4F6] px-4">
      <section className="max-w-lg text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#F97316] text-[#FFFFFF]">
          <MapPinOff className="size-10" />
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-[#F97316]">
          Erro 404
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
          Esta rota não foi encontrada.
        </h1>
        <p className="mt-4 text-[#111827]/60">
          Talvez ela tenha mudado de endereço. Volte para o início e continue por lá.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-[#111827] px-6 text-sm font-black text-[#FFFFFF] hover:bg-[#F97316]"
        >
          Voltar para o CotaMap
        </Link>
      </section>
    </main>
  );
}
