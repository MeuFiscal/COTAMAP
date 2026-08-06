"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type PhotoUploaderProps = {
  onChange?: (file: File | null) => void;
};

export function PhotoUploader({ onChange }: PhotoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectPhoto(file: File | undefined) {
    if (!file) return;
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    onChange?.(file);
  }

  function removePhoto() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    onChange?.(null);
  }

  return (
    <section aria-labelledby="photo-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="photo-title" className="text-lg font-black tracking-[-0.02em]">
            Foto da peça
          </h2>
          <p className="mt-1 text-sm text-[#111827]/50">
            Ajuda a loja a identificar exatamente o que você precisa.
          </p>
        </div>
        <span className="text-xs text-[#111827]/40">Opcional</span>
      </div>

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-3xl border border-[#111827]/10 bg-[#F3F4F6]">
          <div className="relative aspect-[4/3] sm:aspect-[16/8]">
            <Image
              src={previewUrl}
              alt="Pré-visualização da peça selecionada"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={removePhoto}
            className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-black text-[#FFFFFF] shadow-lg transition hover:bg-[#F97316]"
            aria-label="Remover foto selecionada"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remover
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#111827]/20 bg-[#F3F4F6]/60 p-5 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <PhotoAction
              icon={ImagePlus}
              label="Adicionar foto"
              description="Escolher da galeria"
              onClick={() => galleryInputRef.current?.click()}
            />
            <PhotoAction
              icon={Camera}
              label="Tirar foto"
              description="Usar a câmera"
              onClick={() => cameraInputRef.current?.click()}
            />
          </div>
        </div>
      )}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => selectPhoto(event.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => selectPhoto(event.target.files?.[0])}
      />
    </section>
  );
}

type PhotoActionProps = {
  icon: typeof Camera;
  label: string;
  description: string;
  onClick: () => void;
};

function PhotoAction({ icon: Icon, label, description, onClick }: PhotoActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-[#111827]/8 flex min-h-24 items-center gap-4 rounded-2xl border bg-[#FFFFFF] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#F97316] hover:shadow-sm"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F97316]/10 text-[#F97316]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <strong className="block text-sm text-[#111827]">{label}</strong>
        <span className="mt-1 block text-xs text-[#111827]/45">{description}</span>
      </span>
    </button>
  );
}
