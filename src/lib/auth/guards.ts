import { redirect } from "next/navigation";
import { getAuthSession } from "./session";
import { ROUTES } from "@/config/routes";

export async function protectAppRoute() {
  const session = await getAuthSession();
  if (!session) {
    redirect(ROUTES.auth.signIn);
  }
  return session;
}

export async function protectAuthRoute() {
  const session = await getAuthSession();
  if (session) {
    redirect(ROUTES.app.dashboard);
  }
}
