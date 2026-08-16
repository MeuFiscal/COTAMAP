"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { removeBusinessLogo, uploadBusinessLogo } from "@/services/business/registration-service";
import { BusinessLogo } from "@/components/business-logo";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function BusinessLogoEditor({ name, logoUrl, onChanged }: { name: string; logoUrl: string | null; onChanged: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);

  const choose = (file: File | undefined) => {
    if (!file) return;
    if (!TYPES.has(file.type)) { setError("Escolha uma imagem JPG, PNG ou WEBP."); return; }
    if (file.size > MAX_BYTES) { setError("A logo deve ter no máximo 5 MB."); return; }
    if (source) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file)); setZoom(1); setOffset({ x: 0, y: 0 }); setError(null);
  };

  const save = async () => {
    if (!source) return;
    setSaving(true); setError(null);
    try {
      const image = new Image();
      image.src = source;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Não foi possível ler a imagem.")); });
      const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
      const context = canvas.getContext("2d"); if (!context) throw new Error("Seu navegador não suporta o enquadramento da imagem.");
      const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * zoom;
      const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
      context.fillStyle = "#f8fafc"; context.fillRect(0, 0, 512, 512);
      context.drawImage(image, (512 - width) / 2 + offset.x * 2.2, (512 - height) / 2 + offset.y * 2.2, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Não foi possível preparar a logo.")), "image/webp", 0.86));
      onChanged(await uploadBusinessLogo(blob)); setSource(null);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a logo."); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true); setError(null);
    try { await removeBusinessLogo(); onChanged(null); } catch (removeError) { setError(removeError instanceof Error ? removeError.message : "Não foi possível remover a logo."); }
    finally { setSaving(false); }
  };

  const preview = source ?? logoUrl;
  return <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
    <div className="flex flex-wrap items-center gap-4"><BusinessLogo src={preview} name={name} className="size-20"/><div><p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">Identidade da loja</p><h2 className="mt-1 text-xl font-black text-slate-950">Logo da empresa</h2><p className="mt-1 text-sm text-slate-500">JPG, PNG ou WEBP · até 5 MB · formato quadrado</p></div></div>
    {source ? <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center"><div className="relative size-64 touch-none overflow-hidden rounded-3xl bg-white shadow-inner" onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (dragging) setOffset((current) => ({ x: Math.max(-80, Math.min(80, current.x + event.movementX)), y: Math.max(-80, Math.min(80, current.y + event.movementY)) })); }} onPointerUp={() => setDragging(false)}><img src={source} alt="Prévia da logo" className="absolute inset-0 size-full object-cover" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}/><span className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-white/80"/></div><div><label className="text-sm font-black text-slate-700">Ajustar zoom<input aria-label="Zoom da logo" type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-3 w-full accent-orange-500"/></label><p className="mt-2 text-xs text-slate-500">Arraste a imagem para reposicionar e confirme o enquadramento.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"><Upload className="size-4"/>{saving ? "Salvando..." : "Salvar logo"}</button><button type="button" onClick={() => setSource(null)} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">Cancelar</button></div></div></div> : <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => inputRef.current?.click()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"><ImagePlus className="size-4"/>{logoUrl ? "Alterar logo" : "Adicionar logo"}</button>{logoUrl ? <button type="button" onClick={() => void remove()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-50"><Trash2 className="size-4"/>Remover</button> : null}</div>}
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { choose(event.target.files?.[0]); event.currentTarget.value = ""; }}/>
    {error ? <p role="alert" className="mt-4 text-sm font-bold text-red-700">{error}</p> : null}
  </section>;
}
