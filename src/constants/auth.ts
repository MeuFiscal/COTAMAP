export const AUTH_ROUTES = {
  login: "/entrar",
  signUp: "/criar-conta",
  customerSignUp: "/criar-conta/cliente",
  businessSignUp: "/criar-conta/empresa",
  forgotPassword: "/esqueci-senha",
  resetPassword: "/redefinir-senha",
  verifyEmail: "/verificar-email",
  profile: "/perfil",
  completeRegistration: "/completar-cadastro",
  dashboard: "/dashboard",
  admin: "/admin",
  accessDenied: "/acesso-negado",
} as const;

export const PRIVATE_ROUTES = [
  AUTH_ROUTES.resetPassword,
  AUTH_ROUTES.profile,
  AUTH_ROUTES.completeRegistration,
  AUTH_ROUTES.dashboard,
  AUTH_ROUTES.admin,
] as const;

export const USER_ROLES = ["owner", "manager", "employee", "customer", "admin"] as const;

export const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Já existe uma conta com este e-mail.",
  "Password should be at least 6 characters": "A senha não atende aos requisitos mínimos.",
  "New password should be different from the old password.":
    "A nova senha deve ser diferente da senha anterior.",
};
