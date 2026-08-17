import Link from "next/link";
import {
  Brain,
  Zap,
  Target,
  Mail,
  Shield,
  BarChart3,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Lock,
  Clock,
  Compass,
  Repeat,
  FileCheck,
  Cpu,
  Layers,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export default function FeaturesPage() {
  const featurePillars = [
    {
      category: "Cognitive AI Coaching Engine",
      tagline: "Precision LLM intelligence adapted for executive communication",
      icon: Brain,
      badge: "Core AI",
      items: [
        {
          title: "Adaptive Intent Classification",
          description:
            "Evaluates your input in real time to switch seamlessly between realistic roleplay simulations, cognitive distortion reframing, emergency pre-meeting grounding, and strategic career planning.",
          icon: Compass,
        },
        {
          title: "Multi-Turn Context Synthesis",
          description:
            "Retains deep conversational context across sessions. The AI remembers past challenges, focus areas, and milestone progress to provide continuous, cumulative coaching.",
          icon: Layers,
        },
        {
          title: "Cognitive Distortion Detection",
          description:
            "Identifies unhelpful thinking patterns such as catastrophizing, impostor narrative loops, all-or-nothing thinking, and emotional reasoning with gentle Socratic reframes.",
          icon: Sparkles,
        },
        {
          title: "Roleplay & Pressure Testing",
          description:
            "Simulate high-stakes scenarios: salary negotiations, performance reviews, executive Q&A sessions, and board presentations with realistic pushback and constructive scoring.",
          icon: MessageSquare,
        },
      ],
    },
    {
      category: "Behavioral Action Engineering",
      tagline: "Converting abstract insights into measurable real-world confidence",
      icon: Target,
      badge: "Behavioral Science",
      items: [
        {
          title: "Calibrated Micro-Actions",
          description:
            "Every session yields 1–3 concrete 5-to-15 minute experiments designed to test your comfort zone with low risk, establishing empirical behavioral proof of competence.",
          icon: Zap,
        },
        {
          title: "Progressive Desensitization",
          description:
            "Structured difficulty curves that gradually increase communication exposure—from speaking first in team standups to negotiating scope with senior executives.",
          icon: Repeat,
        },
        {
          title: "Behavioral Streak & Commitment",
          description:
            "Track daily execution and action fulfillment. Build momentum through verifiable consistency rather than passive motivational reading.",
          icon: Clock,
        },
        {
          title: "Milestone Reflection Prompts",
          description:
            "Structured retrospective prompts prompt you to capture how each experiment went, what surprised you, and what cognitive barriers disappeared.",
          icon: FileCheck,
        },
      ],
    },
    {
      category: "Automated Synthesis & Delivery",
      tagline: "Proactive weekly accountability delivered directly to your workflow",
      icon: Mail,
      badge: "Automation",
      items: [
        {
          title: "Automated Weekly Dispatches",
          description:
            "Every Monday morning, receive an automated personalized digest synthesizing your weekly breakthroughs, unresolved challenges, and recommended micro-actions.",
          icon: Mail,
        },
        {
          title: "Dual Email Infrastructure",
          description:
            "Support for both managed Resend delivery and native personal Gmail SMTP connections, letting you receive coaching check-ins from your preferred provider.",
          icon: Cpu,
        },
        {
          title: "Longitudinal Growth Analytics",
          description:
            "Visualize your self-efficacy trends over time across negotiation, public speaking, leadership presence, and assertiveness domains.",
          icon: BarChart3,
        },
        {
          title: "Data Portability & Export",
          description:
            "One-click complete data export in clean JSON format, giving you full ownership over your session histories, reflections, and growth milestones.",
          icon: FileCheck,
        },
      ],
    },
    {
      category: "Enterprise Security & Architecture",
      tagline: "Uncompromising privacy and isolated execution boundaries",
      icon: Shield,
      badge: "Security",
      items: [
        {
          title: "AES-256-GCM Credential Encryption",
          description:
            "All sensitive third-party credentials (such as Gmail App Passwords) are encrypted at rest with military-grade authenticated encryption before database storage.",
          icon: Lock,
        },
        {
          title: "Strict Multi-Tenant Isolation",
          description:
            "Every query, vector lookup, and session read is strictly scoped to the authenticated Clerk user identifier, preventing cross-tenant leakage or IDOR vulnerabilities.",
          icon: Shield,
        },
        {
          title: "NVIDIA NIM Inference Acceleration",
          description:
            "Powered by enterprise-grade NVIDIA NIM microservices with low-latency streaming completions and zero training data retention policies.",
          icon: Cpu,
        },
        {
          title: "Right-to-be-Forgotten Deletion",
          description:
            "Instantly erase all conversation histories, user memory records, and email configurations with atomic cascading database purges upon request.",
          icon: Lock,
        },
      ],
    },
  ];

  return (
    <div className="py-14 space-y-16">
      <Container size="default" className="space-y-12">
        {/* Page Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-border bg-panel text-[12px] text-text-secondary rounded-[3px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Capability Specification</span>
          </div>
          <h1 className="text-[22px] font-semibold text-text-primary leading-tight">
            Engineered for Sustainable Behavioral Growth
          </h1>
          <p className="text-[13.5px] text-text-secondary leading-relaxed">
            Elevra replaces open-ended chatbot small talk with structured cognitive behavioral frameworks, daily micro-action accountability, and automated progress syntheses.
          </p>
        </div>

        {/* Feature Pillars */}
        <div className="space-y-14">
          {featurePillars.map((pillar) => {
            const PillarIcon = pillar.icon;
            return (
              <section key={pillar.category} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-[4px] bg-surface-secondary border border-border text-accent">
                      <PillarIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-semibold text-text-primary">{pillar.category}</h2>
                      <p className="text-[12.5px] text-text-secondary">{pillar.tagline}</p>
                    </div>
                  </div>
                  <Badge variant="accent" className="self-start sm:self-auto">
                    {pillar.badge}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pillar.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Card key={item.title} className="bg-panel border-border hover:border-border/80 transition-colors">
                        <CardHeader>
                          <div className="flex items-center gap-2.5">
                            <ItemIcon className="h-4 w-4 text-accent shrink-0" />
                            <CardTitle className="text-[14px] font-semibold">{item.title}</CardTitle>
                          </div>
                          <CardDescription className="text-[12.5px] text-text-secondary mt-1.5 leading-relaxed">
                            {item.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Capabilities Matrix Summary */}
        <div className="p-6 rounded-[6px] border border-border bg-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-text-primary">System Specification Summary</h3>
            <span className="text-[11.5px] text-text-muted">v1.0 Production Architecture</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px]">
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px] space-y-1">
              <div className="text-text-muted text-[11px] uppercase">Latency Budget</div>
              <div className="font-medium text-text-primary">&lt; 350ms TTFT</div>
              <div className="text-[11.5px] text-text-secondary">NVIDIA NIM Streaming</div>
            </div>
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px] space-y-1">
              <div className="text-text-muted text-[11px] uppercase">Crypto Standard</div>
              <div className="font-medium text-text-primary">AES-256-GCM</div>
              <div className="text-[11.5px] text-text-secondary">Authenticated Secrets</div>
            </div>
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px] space-y-1">
              <div className="text-text-muted text-[11px] uppercase">Check-In Schedule</div>
              <div className="font-medium text-text-primary">Mondays @ 09:00 UTC</div>
              <div className="text-[11.5px] text-text-secondary">Vercel Cron Automation</div>
            </div>
            <div className="p-3 border border-border bg-surface-secondary rounded-[4px] space-y-1">
              <div className="text-text-muted text-[11px] uppercase">Auth Security</div>
              <div className="font-medium text-text-primary">Clerk Enterprise</div>
              <div className="text-[11.5px] text-text-secondary">SSR Protected Boundary</div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-[6px] border border-border bg-surface-secondary flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-[16px] font-semibold text-text-primary">Ready to develop unshakeable confidence?</h3>
            <p className="text-[13px] text-text-secondary">
              Experience the structured coaching framework calibrated to your focus areas.
            </p>
          </div>
          <Link href={ROUTES.auth.signUp}>
            <Button size="lg" className="flex items-center gap-2">
              <span>Start Free Assessment</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
