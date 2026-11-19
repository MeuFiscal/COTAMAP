import { createClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hora

export function getAvatarPath(userId: string): string {
  return `${userId}/avatar.webp`;
}

export async function uploadAvatar(file: File): Promise<{ path: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato não suportado. Use JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Arquivo muito grande. O limite é 2 MB.");
  }

  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Sessão expirada. Faça login novamente.");

  const path = getAvatarPath(user.user.id);

  // Converter para WebP usando canvas
  const webpBlob = await convertToWebP(file);
  if (webpBlob.size > MAX_SIZE_BYTES) {
    throw new Error("Imagem recortada excede 2 MB após conversão. Reduza o zoom ou escolha outra imagem.");
  }

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, webpBlob, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    if (error.message.includes("new row violates row-level security")) {
      throw new Error("Permissão negada. Você só pode alterar sua própria foto.");
    }
    throw new Error(error.message || "Falha ao enviar foto.");
  }

  // Atualizar metadata com caminho estável (não URL assinada)
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_path: path },
  });
  if (updateError) {
    console.error("Falha ao atualizar metadata do avatar:", updateError);
  }

  return { path };
}

export async function removeAvatar(): Promise<void> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Sessão expirada.");

  const path = getAvatarPath(user.user.id);

  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (error && !error.message.includes("not found")) {
    throw new Error(error.message || "Falha ao remover foto.");
  }

  // Limpar metadata
  await supabase.auth.updateUser({ data: { avatar_path: null } });
}

export async function getSignedAvatarUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function convertToWebP(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste navegador.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao converter imagem."));
      },
      "image/webp",
      0.85,
    );
  });
}
