import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { protectAuthRoute } from "@/lib/auth/guards";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  await protectAuthRoute();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <Link
          href={ROUTES.public.home}
          className="flex items-center gap-2 font-semibold text-[15px] text-text-primary hover:text-text-primary transition-colors mb-1.5"
        >
          <div className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span>AI Confidence Coach</span>
        </Link>
        <p className="text-[12.5px] text-text-secondary text-center">
          Create your account to start your cognitive calibration
        </p>
      </div>

      <div className="w-full max-w-[420px]">
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-panel border border-border text-text-primary rounded-[4px] shadow-none p-6 sm:p-8",
              headerTitle: "text-[16px] font-semibold text-text-primary tracking-tight",
              headerSubtitle: "text-[12.5px] text-text-secondary mt-1",
              socialButtonsBlockButton:
                "bg-surface-secondary border border-border text-text-primary text-[13px] rounded-[4px] hover:bg-surface-hover transition-colors shadow-none",
              socialButtonsBlockButtonText: "font-medium text-text-primary text-[13px]",
              dividerLine: "bg-border",
              dividerText: "text-[11px] text-text-muted uppercase tracking-wider bg-panel px-2",
              formFieldLabel: "text-[12.5px] text-text-secondary font-medium mb-1",
              formFieldInput:
                "bg-surface-secondary border border-border text-text-primary text-[13.5px] rounded-[4px] focus:border-accent focus:ring-0 transition-colors h-9 shadow-none",
              formButtonPrimary:
                "bg-accent hover:bg-accent-hover text-[#0d0d0d] font-semibold text-[13px] rounded-[4px] transition-colors h-9 shadow-none",
              footerActionText: "text-[12.5px] text-text-secondary",
              footerActionLink: "text-accent hover:underline font-medium text-[12.5px]",
              identityPreviewText: "text-[13px] text-text-primary font-medium",
              identityPreviewEditButton: "text-accent text-[12px] hover:underline",
              formFieldSuccessText: "text-[12px] text-success",
              formFieldErrorText: "text-[12px] text-danger",
              alertText: "text-[12.5px] text-text-primary",
              alert: "bg-surface-secondary border border-border rounded-[4px] p-3 text-text-primary",
              footer: "hidden",
            },
          }}
        />
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 text-[12px] text-text-muted flex items-center gap-4">
        <Link href={ROUTES.public.home} className="hover:text-text-secondary transition-colors">
          Return to Home
        </Link>
        <span>•</span>
        <Link href={ROUTES.public.privacy} className="hover:text-text-secondary transition-colors">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link href={ROUTES.public.terms} className="hover:text-text-secondary transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
}
