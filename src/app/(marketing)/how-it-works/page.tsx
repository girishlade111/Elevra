import Link from "next/link";
import {
  Compass,
  MessageSquare,
  Zap,
  Mail,
  ArrowRight,
  CheckCircle2,
  Brain,
  ShieldCheck,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export default function HowItWorksPage() {
  const phases = [
    {
      step: "01",
      title: "Intake & Confidence Baseline Formulation",
      badge: "Diagnostic Intake",
      summary:
        "Complete a streamlined 2-minute diagnostic to identify your primary friction points: salary negotiation, public speaking, imposter syndrome, or executive presence.",
      points: [
        "Establishes initial self-efficacy scores across key communication dimensions.",
        "Calibrates the AI coach's conversational tone, directness, and challenge level.",
        "Securely records your baseline metrics in isolated, encrypted database records.",
      ],
      icon: Compass,
    },
    {
      step: "02",
      title: "Interactive Cognitive Coaching Sessions",
      badge: "Adaptive AI",
      summary:
        "Engage in structured, multi-turn dialogues powered by NVIDIA NIM. The AI automatically classifies intent and applies specialized cognitive strategies.",
      points: [
        "Real-Time Roleplay: Practice high-pressure discussions with realistic AI stakeholder responses.",
        "Cognitive Reframing: Deconstruct unhelpful thought distortions (catastrophizing, mind-reading).",
        "Pre-Meeting Grounding: Rapid 5-minute confidence alignment routines before major presentations.",
      ],
      icon: MessageSquare,
    },
    {
      step: "03",
      title: "5-to-15 Minute Micro-Action Field Execution",
      badge: "Behavioral Science",
      summary:
        "Theory without action does not build self-efficacy. Every coaching session yields 1–3 low-risk, calibrated behavioral experiments to complete in your daily workflow.",
      points: [
        "Designed to be achievable within 5 to 15 minutes during your regular workday.",
        "Provides progressive desensitization to uncomfortable communication scenarios.",
        "Creates undeniable empirical proof of competence that rewires negative self-beliefs.",
      ],
      icon: Zap,
    },
    {
      step: "04",
      title: "Automated Weekly Synthesis & Reflection Loop",
      badge: "Weekly Automation",
      summary:
        "Every Monday morning at 09:00 UTC, the automated cron engine synthesizes your past week's breakthroughs and delivers a personalized reflection digest to your inbox.",
      points: [
        "Highlights key cognitive shifts and patterns identified across your conversations.",
        "Prompts you with reflection questions to solidify behavioral takeaways.",
        "Delivered reliably via managed Resend infrastructure or your connected personal Gmail SMTP.",
      ],
      icon: Mail,
    },
  ];

  const scenarios = [
    {
      title: "Executive Boardroom Presence",
      focus: "Public Speaking & Conciseness",
      challenge: "Tendency to over-explain and second-guess decisions when presenting to executives.",
      coachApproach:
        "Trains the 'Bottom-Line-Up-Front' (BLUF) communication pattern with live simulation and aggressive time limits.",
      microAction:
        "In your next team meeting, summarize your update in exactly two sentences before inviting questions.",
    },
    {
      title: "High-Stakes Salary & Equity Negotiation",
      focus: "Assertiveness & Negotiation",
      challenge: "Anxiety around naming high anchor numbers and defending market compensation.",
      coachApproach:
        "Simulates a pushback-heavy hiring manager scenario to practice holding silence and maintaining firm boundaries.",
      microAction:
        "Practice delivering your target compensation range out loud 3 times without qualifying or apologizing.",
    },
    {
      title: "Dismantling Senior Imposter Syndrome",
      focus: "Cognitive Reframing",
      challenge: "Persistent feeling that promotions and successes are due to luck rather than competence.",
      coachApproach:
        "Applies Socratic questioning to separate objective evidence of capability from subjective anxiety narratives.",
      microAction:
        "Log two concrete decisions you made this week that positively influenced a team or project outcome.",
    },
    {
      title: "Setting Hard Boundaries with Stakeholders",
      focus: "Assertive Communication",
      challenge: "Defaulting to saying yes to unreasonable deadlines to avoid conflict or disapproval.",
      coachApproach:
        "Provides structured 'Yes, and here is what shifts' phrasing templates to decline urgent scope additions gracefully.",
      microAction:
        "Decline one non-essential meeting or propose an asynchronous update on a low-priority task.",
    },
  ];

  return (
    <div className="py-14 space-y-16">
      <Container size="default" className="space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-border bg-panel text-[12px] text-text-secondary rounded-[3px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Behavioral Framework</span>
          </div>
          <h1 className="text-[22px] font-semibold text-text-primary leading-tight">
            How Elevra Re-Architects Confidence
          </h1>
          <p className="text-[13.5px] text-text-secondary leading-relaxed">
            Confidence is not an ambiguous personality trait. It is a measurable behavioral skillset built through structured reflection, cognitive reframing, and calibrated exposure.
          </p>
        </div>

        {/* 4-Phase Step-by-Step Methodology */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text-primary">The 4-Phase Continuous Growth Loop</h2>
            <span className="text-[12px] text-text-muted">Structured Operational Cycle</span>
          </div>

          <div className="space-y-4">
            {phases.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.step} className="bg-panel border-border">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="text-[13px] font-semibold text-accent px-2 py-0.5 rounded-[3px] border border-border bg-surface-secondary">
                          Phase {p.step}
                        </div>
                        <CardTitle className="text-[15px] font-semibold">{p.title}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="self-start sm:self-auto">
                        {p.badge}
                      </Badge>
                    </div>
                    <CardDescription className="text-[13px] text-text-secondary mt-2 leading-relaxed">
                      {p.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-border/60">
                      {p.points.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12.5px] text-text-secondary">
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Real-World Coaching Scenarios */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Real-World Application Scenarios</h2>
              <p className="text-[12.5px] text-text-secondary mt-0.5">
                How Elevra translates theoretical coaching into tangible workplace outcomes.
              </p>
            </div>
            <Badge variant="accent">Practical Outcomes</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((sc) => (
              <Card key={sc.title} className="bg-panel border-border flex flex-col justify-between">
                <CardHeader>
                  <div className="space-y-1">
                    <span className="text-[11.5px] font-medium text-accent uppercase tracking-wider">
                      {sc.focus}
                    </span>
                    <CardTitle className="text-[14px] font-semibold">{sc.title}</CardTitle>
                  </div>
                  <div className="space-y-2.5 text-[12.5px] pt-3 text-text-secondary">
                    <div>
                      <span className="text-text-muted">Challenge: </span>
                      {sc.challenge}
                    </div>
                    <div>
                      <span className="text-text-muted">Coach Approach: </span>
                      {sc.coachApproach}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="p-2.5 rounded-[4px] border border-border bg-surface-secondary text-[12px] text-text-primary">
                    <span className="font-semibold text-accent">Micro-Action: </span>
                    {sc.microAction}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Evidence-Based Foundations */}
        <div className="p-6 rounded-[6px] border border-border bg-panel space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <h3 className="text-[14px] font-semibold text-text-primary">The Scientific Foundations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12.5px] text-text-secondary leading-relaxed">
            <div className="space-y-1.5 p-3 rounded-[4px] bg-surface-secondary border border-border">
              <div className="font-semibold text-text-primary">Bandura&apos;s Self-Efficacy</div>
              <p>
                Confidence grows primarily through mastery experiences (successful actions), vicarious modeling, and physiological state management.
              </p>
            </div>
            <div className="space-y-1.5 p-3 rounded-[4px] bg-surface-secondary border border-border">
              <div className="font-semibold text-text-primary">Cognitive Reframing (CBT)</div>
              <p>
                By systematically identifying cognitive distortions like catastrophizing and black-and-white thinking, individuals regain objective clarity.
              </p>
            </div>
            <div className="space-y-1.5 p-3 rounded-[4px] bg-surface-secondary border border-border">
              <div className="font-semibold text-text-primary">Systematic Desensitization</div>
              <p>
                Breaking daunting challenges into 5-to-15 minute calibrated micro-steps neutralizes the nervous system&apos;s fight-or-flight response.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-[6px] border border-border bg-surface-secondary flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-[16px] font-semibold text-text-primary">Start your structured confidence training</h3>
            <p className="text-[13px] text-text-secondary">
              Set up your profile in under 2 minutes and experience the AI coaching difference.
            </p>
          </div>
          <Link href={ROUTES.auth.signUp}>
            <Button size="lg" className="flex items-center gap-2">
              <span>Get Started Now</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
