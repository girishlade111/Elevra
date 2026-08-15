/**
 * Route Configuration
 * Defines all public, auth, app workspace, and API endpoints.
 */

export const ROUTES = {
  public: {
    home: "/",
    features: "/features",
    howItWorks: "/how-it-works",
    pricing: "/pricing",
    about: "/about",
    privacy: "/privacy",
    terms: "/terms",
  },
  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
  },
  app: {
    dashboard: "/app",
    onboarding: "/app/onboarding",
    coach: "/app/coach",
    coachHistory: "/app/coach/history",
    coachConversation: (conversationId: string) => `/app/coach/c/${conversationId}`,
    progress: "/app/progress",
    checkIns: "/app/check-ins",
    profile: "/app/profile",
    settings: {
      root: "/app/settings",
      profile: "/app/settings/profile",
      email: "/app/settings/email",
      preferences: "/app/settings/preferences",
    },
  },
  api: {
    chat: "/api/chat",
    onboarding: "/api/onboarding",
    profile: "/api/profile",
    conversations: "/api/conversations",
    email: {
      test: "/api/email/test",
      connect: "/api/email/connect",
      disconnect: "/api/email/disconnect",
    },
    cron: {
      weeklyCheckin: "/api/cron/weekly-checkin",
    },
  },
} as const;

export const PUBLIC_ROUTES: string[] = [
  ROUTES.public.home,
  ROUTES.public.features,
  ROUTES.public.howItWorks,
  ROUTES.public.pricing,
  ROUTES.public.about,
  ROUTES.public.privacy,
  ROUTES.public.terms,
];

export const AUTH_ROUTES: string[] = [
  ROUTES.auth.signIn,
  ROUTES.auth.signUp,
];

export const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some((route) => route === path || (route !== "/" && path.startsWith(route)));
};

export const isAuthRoute = (path: string): boolean => {
  return AUTH_ROUTES.some((route) => path.startsWith(route));
};
