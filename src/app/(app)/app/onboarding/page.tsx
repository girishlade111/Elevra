"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/config/routes";
import type { ConfidenceArea } from "@/types/user";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    fullName: "",
    preferredName: "",
    primaryGoal: "",
    confidenceAreas: [] as ConfidenceArea[],
    currentChallenge: "",
    baselineScore: 5,
    coachingTone: "supportive" as "supportive" | "direct" | "challenging" | "socratic",
    emailUpdatesEnabled: true,
  });

  const availableAreas: { id: ConfidenceArea; label: string }[] = [
    { id: "public_speaking", label: "Public Speaking & Presentations" },
    { id: "career_negotiation", label: "Career & Salary Negotiation" },
    { id: "social_interactions", label: "Social & Networking Confidence" },
    { id: "leadership", label: "Leadership & Decision Authority" },
    { id: "imposter_syndrome", label: "Overcoming Imposter Syndrome" },
    { id: "decision_making", label: "Assertive Decision Making" },
  ];

  const toggleArea = (area: ConfidenceArea) => {
    setFormData((prev) => ({
      ...prev,
      confidenceAreas: prev.confidenceAreas.includes(area)
        ? prev.confidenceAreas.filter((a) => a !== area)
        : [...prev.confidenceAreas, area],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(ROUTES.app.coach);
      } else {
        router.push(ROUTES.app.dashboard);
      }
    } catch {
      router.push(ROUTES.app.dashboard);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <AppHeader
        title="Confidence Intake & Calibration"
        description="Establish your baseline profile to customize your AI Coach's cognitive framework."
      />

      <div className="py-8">
        <Container size="narrow">
          <Card className="bg-panel border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-medium text-accent">Step {step} of 3</div>
                <div className="text-[12px] text-text-muted">
                  {step === 1 && "Identity & Goals"}
                  {step === 2 && "Focus Areas"}
                  {step === 3 && "Coaching Style"}
                </div>
              </div>
              <CardTitle className="text-[16px] mt-1">
                {step === 1 && "Define Your Core Confidence Goal"}
                {step === 2 && "Select Your Primary Focus Areas"}
                {step === 3 && "Calibrate Your Baseline & Coaching Tone"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                      Full Name
                    </label>
                    <Input
                      placeholder="e.g. Alex Chen"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                      Preferred First Name
                    </label>
                    <Input
                      placeholder="e.g. Alex"
                      value={formData.preferredName}
                      onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                      What is your single biggest confidence goal right now?
                    </label>
                    <Textarea
                      placeholder="e.g. I want to speak up confidently in executive meetings without second-guessing my expertise."
                      value={formData.primaryGoal}
                      onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="text-[13px] text-text-secondary">
                    Choose one or more domains where self-doubt most frequently limits you:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {availableAreas.map((area) => {
                      const selected = formData.confidenceAreas.includes(area.id);
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => toggleArea(area.id)}
                          className={`p-3 rounded-[4px] border text-left text-[13px] transition-colors flex items-center justify-between ${
                            selected
                              ? "border-accent bg-accent/10 text-text-primary font-medium"
                              : "border-border bg-surface-secondary text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          <span>{area.label}</span>
                          {selected && <Check className="h-4 w-4 text-accent" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-2">
                    <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                      Immediate specific challenge (optional)
                    </label>
                    <Textarea
                      placeholder="Describe any specific upcoming situation (e.g. presentation next Tuesday)."
                      value={formData.currentChallenge}
                      onChange={(e) =>
                        setFormData({ ...formData, currentChallenge: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[13.5px] font-medium text-text-primary">
                        Baseline Confidence Rating (1–10)
                      </label>
                      <span className="text-[14px] font-semibold text-accent">
                        {formData.baselineScore} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={formData.baselineScore}
                      onChange={(e) =>
                        setFormData({ ...formData, baselineScore: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[13.5px] font-medium text-text-primary mb-2">
                      Preferred Coaching Tone
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "supportive" as const, label: "Supportive & Encouraging" },
                        { id: "direct" as const, label: "Direct & Practical" },
                        { id: "challenging" as const, label: "Challenging & Rigorous" },
                        { id: "socratic" as const, label: "Socratic & Reflective" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, coachingTone: t.id })}
                          className={`p-2.5 rounded-[4px] border text-center text-[12.5px] transition-colors ${
                            formData.coachingTone === t.id
                              ? "border-accent bg-accent/10 text-text-primary font-medium"
                              : "border-border bg-surface-secondary text-text-secondary"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              {step > 1 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button
                  size="sm"
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? "Calibrating..." : "Complete Setup"}</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </Container>
      </div>
    </div>
  );
}
