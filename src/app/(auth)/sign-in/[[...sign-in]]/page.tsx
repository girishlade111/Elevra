import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignIn
        appearance={{
          elements: {
            card: "bg-panel border border-border text-text-primary rounded-[6px] shadow-none",
            headerTitle: "text-[16px] font-semibold text-text-primary",
            headerSubtitle: "text-[12.5px] text-text-secondary",
            formButtonPrimary: "bg-accent text-[#0d0d0d] font-semibold text-[13px] rounded-[4px] hover:bg-accent-hover",
            formFieldInput: "bg-surface-secondary border-border text-text-primary text-[13.5px] rounded-[4px]",
            formFieldLabel: "text-[12.5px] text-text-secondary font-medium",
            footerActionText: "text-[12.5px] text-text-secondary",
            footerActionLink: "text-accent hover:underline",
          },
        }}
      />
    </div>
  );
}
