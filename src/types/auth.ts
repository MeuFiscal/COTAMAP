import type { USER_ROLES } from "@/constants/auth";

export type AccountType = "customer" | "business";
export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
};

export type CustomerSignUpInput = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
};

export type BusinessSignUpInput = {
  businessName: string;
  responsibleName: string;
  phone: string;
  whatsapp: string;
  postalCode: string;
  addressNumber: string;
  email: string;
  password: string;
};
