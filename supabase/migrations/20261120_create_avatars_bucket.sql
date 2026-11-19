-- ============================================================
-- Migração: Bucket privado "avatars" para fotos de perfil
-- Data: 2026-11-20
-- Descrição: Cria bucket privado com policies restritivas
-- que permitem apenas ao usuário autenticado acessar seu próprio avatar.
-- ============================================================

-- NOTA: O bucket deve ser criado manualmente via Dashboard do Supabase:
-- Storage > New Bucket
-- Nome: avatars
-- Public bucket: OFF (desmarcado)
-- File size limit: 2097152 (2 MB)
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Após criar o bucket, execute as policies abaixo no SQL Editor:

-- Policy 1: INSERT — apenas no próprio caminho exato
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
 bucket_id = 'avatars'
 AND name = auth.uid::text || '/avatar.webp'
);

-- Policy 2: SELECT — apenas o próprio avatar
CREATE POLICY "avatars_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
 bucket_id = 'avatars'
 AND name = auth.uid::text || '/avatar.webp'
);

-- Policy 3: UPDATE — apenas o próprio avatar, impedindo mudança de caminho
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
 bucket_id = 'avatars'
 AND name = auth.uid::text || '/avatar.webp'
)
WITH CHECK (
 bucket_id = 'avatars'
 AND name = auth.uid::text || '/avatar.webp'
);

-- Policy 4: DELETE — apenas o próprio avatar
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
 bucket_id = 'avatars'
 AND name = auth.uid::text || '/avatar.webp'
);

-- ============================================================
-- PLANO DE REVERSÃO (não apaga fotos dos usuários):
-- ============================================================
-- DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
-- DROP POLICY IF EXISTS "avatars_select_own" ON storage.objects;
-- DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
-- DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
-- O bucket e os arquivos permanecem intactos.
-- Para remover o bucket manualmente: Dashboard > Storage > Delete bucket "avatars"
