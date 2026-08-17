import * as React from "react";
import Link from "next/link";
import { Check, HelpCircle, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      badge: "Free Forever",
      price: "$0",
      period: "forever",
      description: "Essential tools to evaluate your confidence baseline and explore structured AI coaching.",
      highlight: false,
      buttonText: "Start for Free",
      buttonVariant: "secondary" as const,
      features: [
        "10 AI coaching sessions / month",
        "Baseline confidence diagnostic & profile",
        "Standard NVIDIA NIM model completions",
        "Bi-weekly email progress summary",
        "Core micro-action recommendations",
        "Community & documentation support",
      ],
    },
    {
      name: "Pro Executive",
      badge: "Recommended",
      price: "$19",
      period: "/ month",
      description: "Full access for professionals actively preparing for high-stakes meetings and leadership roles.",
      highlight: true,
      buttonText: "Upgrade to Pro",
      buttonVariant: "default" as const,
      features: [
        "Unlimited NVIDIA NIM coaching sessions",
        "Sub-350ms low-latency inference streaming",
        "Automated Monday 09:00 UTC weekly check-ins",
        "Custom Gmail SMTP & Resend email integration",
        "Longitudinal confidence tracking & analytics",
        "Pre-meeting 5-minute rapid grounding routines",
        "One-click comprehensive data export",
        "Priority email support",
      ],
    },
    {
      name: "Team & Enterprise",
      badge: "Organizations",
      price: "$49",
      period: "/ seat / month",
      description: "Dedicated coaching infrastructure for engineering teams, leadership cohorts, and organizations.",
      highlight: false,
      buttonText: "Contact Sales",
      buttonVariant: "secondary" as const,
      features: [
        "Everything included in Pro Executive",
        "Team aggregate confidence benchmark reports",
        "Custom organizational communication playbooks",
        "Centralized team billing & seat administration",
        "Enterprise SSO / SAML authentication",
        "Dedicated onboarding & coaching success manager",
        "Custom data retention & deletion policies",
        "99.9% availability SLA guarantee",
      ],
    },
  ];

  const comparisonCategories = [
    {
      category: "Coaching & AI Engine",
      rows: [
        { feature: "Monthly Coaching Sessions", starter: "10 sessions", pro: "Unlimited", team: "Unlimited" },
        { feature: "AI Model Tier", starter: "Standard NIM", pro: "Accelerated NIM", team: "Accelerated NIM" },
        { feature: "Response Latency", starter: "~800ms", pro: "< 350ms", team: "< 350ms" },
        { feature: "Roleplay Simulation Modes", starter: "Basic", pro: "Advanced Multi-Turn", team: "Custom Playbooks" },
        { feature: "Pre-Meeting Emergency Grounding", starter: "—", pro: "✓ Included", team: "✓ Included" },
      ],
    },
    {
      category: "Behavioral Analytics & Memory",
      rows: [
        { feature: "Longitudinal Trend History", starter: "14 Days", pro: "Full History", team: "Full History" },
        { feature: "Multi-Turn Context Synthesis", starter: "Session-only", pro: "Cumulative", team: "Cumulative" },
        { feature: "Micro-Action Tracking & Streaks", starter: "✓ Included", pro: "✓ Included", team: "✓ Included" },
        { feature: "Team Benchmark Reports", starter: "—", pro: "—", team: "✓ Included" },
      ],
    },
    {
      category: "Delivery & Integrations",
      rows: [
        { feature: "Automated Monday Check-Ins", starter: "Bi-weekly", pro: "Weekly (9 AM UTC)", team: "Weekly Custom" },
        { feature: "Gmail SMTP Integration", starter: "—", pro: "✓ Included", team: "✓ Included" },
        { feature: "Resend Managed Delivery", starter: "✓ Included", pro: "✓ Included", team: "✓ Included" },
        { feature: "JSON / Data Portability Export", starter: "Basic", pro: "Full Export", team: "Full + API Access" },
      ],
    },
    {
      category: "Security & Administration",
      rows: [
        { feature: "AES-256-GCM Credential Encryption", starter: "✓ Included", pro: "✓ Included", team: "✓ Included" },
        { feature: "Multi-Tenant IDOR Protection", starter: "✓ Included", pro: "✓ Included", team: "✓ Included" },
        { feature: "SSO / SAML (Okta, Google)", starter: "—", pro: "—", team: "✓ Included" },
        { feature: "Dedicated Support & SLA", starter: "Community", pro: "Priority Email", team: "Dedicated / 99.9% SLA" },
      ],
    },
  ];

  const faqs = [
    {
      q: "Can I cancel or change my plan at any time?",
      a: "Yes. You can upgrade, downgrade, or cancel your subscription at any time with zero penalty. If you cancel, your Pro features remain active until the end of your current billing cycle.",
    },
    {
      q: "How does the Gmail SMTP integration work? Is my password safe?",
      a: "Elevra connects via standard Gmail App Passwords (with 2-Step Verification). Your credentials are encrypted at rest using industry-standard AES-256-GCM authenticated encryption before being saved to the database. We never store plain text passwords.",
    },
    {
      q: "What AI infrastructure powers Elevra?",
      a: "Elevra is powered by enterprise NVIDIA NIM microservices executing optimized Meta LLaMA-3.1 70B parameter models. This guarantees low-latency completions and strict data privacy with zero training data retention.",
    },
    {
      q: "How are the automated weekly check-ins generated?",
      a: "Every Monday at 09:00 UTC, an automated cron workflow analyzes your conversational breakthroughs and pending micro-actions to construct a concise, high-value email reflection digest delivered directly to your inbox.",
    },
    {
      q: "Can I completely delete my data?",
      a: "Yes. You have full ownership of your data. You can export your complete history in JSON format at any time or execute a permanent right-to-be-forgotten deletion that removes all conversations, memory vectors, and credentials instantly.",
    },
  ];

  return (
    <div className="py-14 space-y-16">
      <Container size="default" className="space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-border bg-panel text-[12px] text-text-secondary rounded-[3px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Transparent Pricing</span>
          </div>
          <h1 className="text-[22px] font-semibold text-text-primary leading-tight">
            Predictable Plans for Measurable Growth
          </h1>
          <p className="text-[13.5px] text-text-secondary leading-relaxed">
            Invest in structured behavioral coaching. Free forever for essentials, or unlock unlimited sessions and automated digests with Pro.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-panel flex flex-col justify-between ${
                plan.highlight
                  ? "border-accent shadow-[0_0_15px_rgba(224,120,86,0.15)] relative"
                  : "border-border"
              }`}
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold">{plan.name}</CardTitle>
                    <Badge variant={plan.highlight ? "accent" : "secondary"}>{plan.badge}</Badge>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-[26px] font-bold text-text-primary">{plan.price}</span>
                    <span className="text-[12px] text-text-secondary">{plan.period}</span>
                  </div>
                  <CardDescription className="text-[12.5px] text-text-secondary mt-2 leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-2">
                  <div className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider mb-2">
                    Included Features
                  </div>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12.5px] text-text-secondary">
                      <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </CardContent>
              </div>
              <CardFooter className="pt-4 border-t border-border/60">
                <Link href={ROUTES.auth.signUp} className="w-full">
                  <Button variant={plan.buttonVariant} className="w-full">
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Detailed Feature Comparison Table */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text-primary">Detailed Plan Feature Matrix</h2>
            <span className="text-[12px] text-text-muted">Comprehensive Comparison</span>
          </div>

          <div className="rounded-[6px] border border-border bg-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary text-text-muted text-[11.5px] uppercase">
                    <th className="py-3 px-4 font-medium">Capability</th>
                    <th className="py-3 px-4 font-medium">Starter ($0)</th>
                    <th className="py-3 px-4 font-medium text-accent">Pro ($19/mo)</th>
                    <th className="py-3 px-4 font-medium">Enterprise ($49)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {comparisonCategories.map((cat) => (
                    <React.Fragment key={cat.category}>
                      <tr className="bg-surface-secondary/40">
                        <td colSpan={4} className="py-2 px-4 font-semibold text-text-primary text-[12px]">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.rows.map((row) => (
                        <tr key={row.feature} className="hover:bg-surface-secondary/20 transition-colors">
                          <td className="py-2.5 px-4 text-text-secondary">{row.feature}</td>
                          <td className="py-2.5 px-4 text-text-muted">{row.starter}</td>
                          <td className="py-2.5 px-4 font-medium text-text-primary">{row.pro}</td>
                          <td className="py-2.5 px-4 text-text-secondary">{row.team}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text-primary">Frequently Asked Questions</h2>
            <Badge variant="secondary">Clarity & Guarantees</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="bg-panel border-border">
                <CardHeader>
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <CardTitle className="text-[13.5px] font-semibold">{faq.q}</CardTitle>
                      <CardDescription className="text-[12.5px] text-text-secondary mt-1.5 leading-relaxed">
                        {faq.a}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-[6px] border border-border bg-surface-secondary flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-[16px] font-semibold text-text-primary">Experience the Pro coaching advantage</h3>
            <p className="text-[13px] text-text-secondary">
              Get started with zero risk. Upgrade anytime as your coaching frequency expands.
            </p>
          </div>
          <Link href={ROUTES.auth.signUp}>
            <Button size="lg" className="flex items-center gap-2">
              <span>Create Your Account</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
