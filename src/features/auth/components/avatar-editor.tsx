"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Trash2, Upload, X } from "lucide-react";

import { getSignedAvatarUrl, removeAvatar, uploadAvatar } from "@/services/auth/avatar-service";

type AvatarEditorProps = {
 userId: string;
 currentPath?: string | null;
 initials: string;
 onUpdate: (signedUrl: string | null) => void;
 onClose: () => void;
};

export function AvatarEditor({ userId, currentPath, initials, onUpdate, onClose }: AvatarEditorProps) {
 const [imageSrc, setImageSrc] = useState<string | null>(null);
 const [crop, setCrop] = useState({ x: 0, y: 0 });
 const [zoom, setZoom] = useState(1);
 const [croppedArea, setCroppedArea] = useState<Area | null>(null);
 const [uploading, setUploading] = useState(false);
 const [removing, setRemoving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;
 setError(null);
 const reader = new FileReader();
 reader.onload = () => setImageSrc(reader.result as string);
 reader.onerror = () => setError("Não foi possível ler o arquivo.");
 reader.readAsDataURL(file);
 }, []);

 const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
 setCroppedArea(areaPixels);
 }, []);

 const onSave = useCallback(async () => {
 if (!imageSrc || !croppedArea) return;
 setUploading(true);
 setError(null);
 try {
 const croppedBlob = await getCroppedBlob(imageSrc, croppedArea);
 const file = new File([croppedBlob], "avatar.webp", { type: "image/webp" });
 await uploadAvatar(file);
 const signedUrl = await getSignedAvatarUrl(`${userId}/avatar.webp`);
 onUpdate(signedUrl);
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Falha ao salvar foto.");
 } finally {
 setUploading(false);
 }
 }, [imageSrc, croppedArea, userId, onUpdate, onClose]);

 const onRemove = useCallback(async () => {
 setRemoving(true);
 setError(null);
 try {
 await removeAvatar();
 onUpdate(null);
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Falha ao remover foto.");
 } finally {
 setRemoving(false);
 }
 }, [onUpdate, onClose]);

 return (
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
 <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
 <h2 className="text-lg font-black text-slate-950">Foto de perfil</h2>
 <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-xl hover:bg-slate-100">
 <X className="size-5 text-slate-500" />
 </button>
 </div>

 {/* Content */}
 <div className="p-6">
 {error && (
 <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
 )}

 {!imageSrc ? (
 <div className="space-y-4">
 {/* Preview atual */}
 <div className="flex items-center gap-4">
 <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-orange-200 bg-orange-50 text-2xl font-black text-[#F97316]">
 {currentPath ? (
 <span className="text-xs font-bold text-slate-400">Carregando...</span>
 ) : (
 initials
 )}
 </div>
 <div>
 <p className="font-black text-slate-950">{currentPath ? "Foto atual" : "Sem foto"}</p>
 <p className="text-sm text-slate-500">Escolha uma imagem da galeria ou computador.</p>
 </div>
 </div>

 {/* Botões */}
 <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
 <button
 type="button"
 onClick={() => inputRef.current?.click()}
 className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 font-bold text-white transition hover:bg-[#EA6800]"
 >
 <Upload className="size-4" />
 Escolher imagem
 </button>
 {currentPath && (
 <button
 type="button"
 onClick={onRemove}
 disabled={removing}
 className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
 >
 <Trash2 className="size-4" />
 {removing ? "Removendo..." : "Remover foto"}
 </button>
 )}
 </div>
 ) : (
 <div className="space-y-4">
 {/* Cropper */}
 <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-slate-900">
 <Cropper
 image={imageSrc}
 crop={crop}
 zoom={zoom}
 aspect={1}
 cropShape="round"
 showGrid={false}
 onCropChange={setCrop}
 onZoomChange={setZoom}
 onCropComplete={onCropComplete}
 />
 </div>

 {/* Zoom slider */}
 <div>
 <label className="text-xs font-bold text-slate-500">Zoom</label>
 <input
 type="range"
 min={1}
 max={3}
 step={0.05}
 value={zoom}
 onChange={(e) => setZoom(Number(e.target.value))}
 className="mt-1 w-full accent-[#F97316]"
 />
 </div>

 {/* Ações */}
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => { setImageSrc(null); setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedArea(null); }}
 className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
 >
 Voltar
 </button>
 <button
 type="button"
 onClick={onSave}
 disabled={uploading}
 className="flex-1 rounded-xl bg-[#F97316] px-4 py-3 font-bold text-white transition hover:bg-[#EA6800] disabled:opacity-50"
 >
 {uploading ? "Salvando..." : "Salvar foto"}
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

async function getCroppedBlob(imageSrc: string, cropArea: Area): Promise<Blob> {
 const image = new Image();
 image.src = imageSrc;
 await new Promise<void>((resolve) => { image.onload = () => resolve(); });

 const canvas = document.createElement("canvas");
 const ctx = canvas.getContext("2d");
 if (!ctx) throw new Error("Canvas não suportado.");

 const size = 400;
 canvas.width = size;
 canvas.height = size;

 ctx.imageSmoothingQuality = "high";
 ctx.drawImage(
 image,
 cropArea.x,
 cropArea.y,
 cropArea.width,
 cropArea.height,
 0,
 0,
 size,
 size,
 );

 return new Promise((resolve, reject) => {
 canvas.toBlob(
 (blob) => {
 if (blob) resolve(blob);
 else reject(new Error("Falha ao gerar imagem recortada."));
 },
 "image/webp",
 0.85,
 );
 });
}
