import { redirect } from "next/navigation";
import { getCurrentUser } from "./get-current-user";
import { requireAuth } from "./require-auth";
import { ROUTES } from "@/config/routes";

export async function protectAppRoute() {
  return await requireAuth({ requireOnboarding: false });
}

export async function protectAuthRoute() {
  const user = await getCurrentUser();
  if (user) {
    redirect(ROUTES.app.dashboard);
  }
}
