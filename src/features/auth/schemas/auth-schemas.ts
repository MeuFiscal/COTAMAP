import { z } from "zod";

import { digitsOnly } from "@/features/auth/utils/formatters";

const email = z.string().trim().email("Informe um e-mail válido.");
const phone = z
  .string()
  .trim()
  .refine((value) => digitsOnly(value).length >= 10, "Informe um telefone válido.");
const password = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/\d/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial.");
const terms = z.boolean().refine((value) => value, "Aceite os termos para continuar.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
  remember: z.boolean(),
});

export const customerSignUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo."),
    phone,
    email,
    password,
    confirmPassword: z.string(),
    terms,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const businessSignUpSchema = z
  .object({
    businessName: z.string().trim().min(2, "Informe o nome da empresa."),
    responsibleName: z.string().trim().min(3, "Informe o nome do responsável."),
    phone,
    whatsapp: phone,
    postalCode: z
      .string()
      .refine((value) => digitsOnly(value).length === 8, "Informe um CEP válido."),
    addressNumber: z.string().trim().min(1, "Informe o número."),
    email,
    password,
    confirmPassword: z.string(),
    terms,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo."),
  phone,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CustomerSignUpFormData = z.infer<typeof customerSignUpSchema>;
export type BusinessSignUpFormData = z.infer<typeof businessSignUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
