import Link from "next/link";
import { MessageSquare, Shield, CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { ROUTES } from "@/config/routes";

export default function HomePage() {
  const featureList = [
    {
      title: "Targeted Confidence Coaching",
      description: "Structured cognitive behavioral guidance calibrated to your specific communication challenges.",
      icon: MessageSquare,
    },
    {
      title: "Real-Time Intent Detection",
      description: "Instantaneous classification of roleplay, mindset reframing, crisis encouragement, and planning.",
      icon: Shield,
    },
    {
      title: "Micro-Action Execution",
      description: "Every coaching session generates precise 5-to-15 minute actionable experiments.",
      icon: CheckCircle2,
    },
    {
      title: "Automated Weekly Synthesis",
      description: "Personalized progress check-ins delivered directly to your inbox via Resend or Gmail SMTP.",
      icon: Mail,
    },
  ];

  return (
    <div className="py-16 space-y-16">
      <Container size="default">
        {/* Header Hero */}
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-border bg-panel text-[12px] text-text-secondary rounded-[3px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Production Architecture Foundation</span>
          </div>

          <h1 className="text-[22px] font-semibold text-text-primary leading-tight">
            Personalized AI Coaching for Unshakeable Confidence
          </h1>

          <p className="text-[13.5px] text-text-secondary leading-relaxed">
            A structured system designed to dismantle imposter syndrome, prepare for high-stakes conversations, and develop consistent self-efficacy through targeted daily micro-actions.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Link href={ROUTES.auth.signUp}>
              <Button size="lg" className="flex items-center gap-2">
                <span>Start Coaching Session</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={ROUTES.public.howItWorks}>
              <Button variant="secondary" size="lg">
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-12">
          {featureList.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="bg-panel border-border">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-accent shrink-0" />
                    <CardTitle className="text-[14px] font-semibold">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-[12.5px] text-text-secondary mt-1">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Architecture Spec Panel */}
        <div className="mt-12 p-6 rounded-[6px] border border-border bg-panel space-y-3">
          <div className="text-[12.5px] font-medium text-text-muted uppercase tracking-wider">
            Architecture Highlights
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-[13px]">
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px]">
              <div className="text-text-secondary text-[11.5px]">Framework</div>
              <div className="font-medium text-text-primary mt-0.5">Next.js 15 App Router</div>
            </div>
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px]">
              <div className="text-text-secondary text-[11.5px]">Intelligence</div>
              <div className="font-medium text-text-primary mt-0.5">NVIDIA NIM Engine</div>
            </div>
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px]">
              <div className="text-text-secondary text-[11.5px]">Email Infrastructure</div>
              <div className="font-medium text-text-primary mt-0.5">Resend / Gmail SMTP</div>
            </div>
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px]">
              <div className="text-text-secondary text-[11.5px]">Authentication</div>
              <div className="font-medium text-text-primary mt-0.5">Clerk Native Auth</div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
