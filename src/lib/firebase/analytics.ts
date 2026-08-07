import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirebaseApp } from "./firebase";

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app || !(await isSupported())) return null;
  return getAnalytics(app);
}
