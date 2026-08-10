import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/constants/auth";
import { requireUser } from "@/features/auth/server/guards";
export default async function CompleteRegistrationPage() {
  await requireUser();
  redirect(AUTH_ROUTES.businessDashboard);
}
