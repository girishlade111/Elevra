import Link from "next/link";
import {
  Brain,
  Shield,
  Target,
  Sparkles,
  ArrowRight,
  Code2,
  Lock,
  Layers,
  HeartHandshake,
  CheckCircle2,
  Terminal,
  Cpu,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export default function AboutPage() {
  const pillars = [
    {
      title: "Mastery Over Motivation",
      concept: "Bandura's Self-Efficacy",
      description:
        "Confidence is not manufactured through passive affirmations. It is built through direct mastery experiences—completing small, high-leverage actions in the real world.",
      icon: Target,
    },
    {
      title: "Cognitive Reframing",
      concept: "Cognitive Behavioral Therapy (CBT)",
      description:
        "Imposter syndrome and presentation dread stem from systematic cognitive distortions. We use Socratic inquiry to replace anxiety loops with empirical evidence.",
      icon: Brain,
    },
    {
      title: "Calibrated Exposure",
      concept: "Progressive Desensitization",
      description:
        "Facing fear in manageable 5-to-15 minute doses safely desensitizes the autonomic nervous system, permanently lowering social and workplace friction.",
      icon: Sparkles,
    },
  ];

  const engineeringPrinciples = [
    {
      title: "Deterministic Privacy & Security",
      description:
        "Every session, note, and credential is bound to an isolated tenant identifier. Sensitive keys use AES-256-GCM encryption at rest, and zero conversation data is used to train third-party foundation models.",
      icon: Lock,
    },
    {
      title: "Low-Latency Direct Intelligence",
      description:
        "Powered by NVIDIA NIM microservices running Meta LLaMA-3.1 70B Instruct, delivering instantaneous conversational streaming with precise prompt alignment.",
      icon: Cpu,
    },
    {
      title: "Action-First Architecture",
      description:
        "Unlike generic LLM chat interfaces that indulge in circular conversation, our agentic prompt pipeline actively funnels every interaction into measurable micro-action commitments.",
      icon: Layers,
    },
  ];

  const stackItems = [
    { label: "Application Framework", value: "Next.js 15 (App Router, Server Components)" },
    { label: "AI & Model Hosting", value: "NVIDIA NIM (Meta LLaMA-3.1 70B Instruct)" },
    { label: "Database & ORM", value: "Neon Serverless PostgreSQL + Drizzle ORM" },
    { label: "Identity & Session Security", value: "Clerk Enterprise Native SSR Auth" },
    { label: "Email Dispatch Engine", value: "Resend Transactional API + Nodemailer Gmail SMTP" },
    { label: "Job Automation", value: "Vercel Cron (HMAC Bearer Protected @ 09:00 UTC)" },
  ];

  return (
    <div className="py-14 space-y-16">
      <Container size="default" className="space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-border bg-panel text-[12px] text-text-secondary rounded-[3px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Mission & Engineering Philosophy</span>
          </div>
          <h1 className="text-[22px] font-semibold text-text-primary leading-tight">
            The Psychology & Engineering Behind Elevra
          </h1>
          <p className="text-[13.5px] text-text-secondary leading-relaxed">
            We built Elevra to transform professional coaching from an expensive, subjective luxury into a structured, daily behavioral science system accessible to everyone.
          </p>
        </div>

        {/* The Problem & Our Thesis */}
        <div className="p-6 rounded-[6px] border border-border bg-panel space-y-4">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-accent" />
            <h2 className="text-[15px] font-semibold text-text-primary">
              Why Generic AI Chatbots Fail at Psychological Growth
            </h2>
          </div>
          <div className="space-y-3 text-[13px] text-text-secondary leading-relaxed">
            <p>
              Standard conversational AI tools are trained to be agreeable and open-ended. When users express self-doubt or imposter feelings, generic bots offer platitudes and superficial cheerleading. While this provides temporary emotional relief, it changes nothing in actual behavior.
            </p>
            <p>
              Elevra operates on a fundamentally different paradigm. We treat confidence as an empirical feedback loop:
              <span className="text-text-primary font-medium"> Thought Distortion → Socratic Reframing → Low-Risk Micro-Experiment → Behavioral Proof.</span>
            </p>
          </div>
        </div>

        {/* The 3 Scientific Pillars */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text-primary">The Scientific Foundations</h2>
            <Badge variant="accent">Evidence-Based</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="bg-panel border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-accent shrink-0" />
                      <CardTitle className="text-[14px] font-semibold">{p.title}</CardTitle>
                    </div>
                    <div className="text-[11.5px] font-medium text-accent mt-1">{p.concept}</div>
                    <CardDescription className="text-[12.5px] text-text-secondary mt-2 leading-relaxed">
                      {p.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Engineering Rigor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text-primary">Engineering Principles</h2>
            <span className="text-[12px] text-text-muted">Enterprise Architecture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {engineeringPrinciples.map((ep) => {
              const Icon = ep.icon;
              return (
                <Card key={ep.title} className="bg-panel border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-accent shrink-0" />
                      <CardTitle className="text-[14px] font-semibold">{ep.title}</CardTitle>
                    </div>
                    <CardDescription className="text-[12.5px] text-text-secondary mt-2 leading-relaxed">
                      {ep.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Technical Architecture Stack */}
        <div className="p-6 rounded-[6px] border border-border bg-panel space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-accent" />
              <h3 className="text-[14px] font-semibold text-text-primary">Production Infrastructure & Stack</h3>
            </div>
            <Badge variant="secondary">Verified Architecture</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[12.5px]">
            {stackItems.map((item) => (
              <div
                key={item.label}
                className="p-3 border border-border bg-surface-secondary rounded-[4px] flex flex-col justify-between"
              >
                <div className="text-text-muted text-[11px] uppercase">{item.label}</div>
                <div className="font-medium text-text-primary mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-[6px] border border-border bg-surface-secondary flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-[16px] font-semibold text-text-primary">Experience the science-backed system</h3>
            <p className="text-[13px] text-text-secondary">
              Take the first step toward lasting communication confidence today.
            </p>
          </div>
          <Link href={ROUTES.auth.signUp}>
            <Button size="lg" className="flex items-center gap-2">
              <span>Begin Your Journey</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
