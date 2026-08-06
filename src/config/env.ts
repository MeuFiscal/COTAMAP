const requiredPublicEnvironment = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} as const;

function requirePublicValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não configurada: ${name}`);
  }

  return value;
}

export function getPublicEnvironment() {
  return {
    supabaseUrl: requirePublicValue(
      requiredPublicEnvironment.supabaseUrl,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    supabasePublishableKey: requirePublicValue(
      requiredPublicEnvironment.supabasePublishableKey,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
  } as const;
}
