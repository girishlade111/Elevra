"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Save, Sparkles, Mail, Sliders } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const COACHING_TONE_OPTIONS = [
  { id: "supportive", label: "Empathetic & Supportive", desc: "Focuses on validation, psychological safety, and gradual reframing." },
  { id: "direct", label: "Direct & Challenging", desc: "High accountability, rapid bottleneck identification, and assertive roleplay." },
  { id: "analytical", label: "Structured & Analytical", desc: "Frameworks, step-by-step cognitive models, and tactical communication breakdowns." },
] as const;

interface PreferencesViewProps {
  initialWeeklyEnabled: boolean;
  initialProvider: "resend" | "gmail";
  initialDestinationEmail: string;
}

export function PreferencesView({
  initialWeeklyEnabled,
  initialProvider,
  initialDestinationEmail,
}: PreferencesViewProps) {
  const [weeklyDigest, setWeeklyDigest] = React.useState(initialWeeklyEnabled);
  const [selectedProvider, setSelectedProvider] = React.useState<"resend" | "gmail">(initialProvider);
  const [coachingTone, setCoachingTone] = React.useState<string>("supportive");
  const [intentTags, setIntentTags] = React.useState(true);
  const [microActions, setMicroActions] = React.useState(true);

  const [saving, setSaving] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/email/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyCheckinsEnabled: weeklyDigest,
          provider: selectedProvider,
          destinationEmail: initialDestinationEmail,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setStatusMessage({
          type: "success",
          text: "Experience preferences updated successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: json.error?.message || "Failed to update preferences.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error saving preferences.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-panel border-border max-w-3xl">
      <CardHeader className="p-4 sm:p-5 border-b border-border/80 bg-surface-secondary/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[15px] font-semibold text-text-primary">
              Coaching Experience &amp; Delivery Preferences
            </CardTitle>
            <CardDescription className="text-[12.5px] mt-0.5">
              Customize coaching delivery frequency, model tone, and interface tags.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-border text-text-muted text-[11px]">
            Preferences
          </Badge>
        </div>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="p-4 sm:p-5 space-y-5">
          {statusMessage && (
            <div
              className={`p-3 rounded-[4px] border text-[12.5px] flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Weekly Delivery Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/60">
            <div className="space-y-0.5">
              <div className="text-[13.5px] font-medium text-text-primary flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <span>Weekly Coaching Synthesis Digest</span>
              </div>
              <p className="text-[12px] text-text-secondary">
                Receive automated synthesis briefings with micro-challenges every Monday at 09:00 UTC.
              </p>
            </div>
            <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
          </div>

          {/* Delivery Provider Selector */}
          <div className="space-y-2 py-2 border-b border-border/60">
            <label className="block text-[13px] font-medium text-text-primary">
              Default Email Dispatch Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedProvider("resend")}
                className={`p-3 rounded-[6px] border text-left transition-colors ${
                  selectedProvider === "resend"
                    ? "border-accent bg-accent/5 text-text-primary"
                    : "border-border bg-surface-secondary text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className="text-[13px] font-semibold">Resend Platform</div>
                <div className="text-[11.5px] text-text-muted mt-0.5">Verified platform transactional delivery</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider("gmail")}
                className={`p-3 rounded-[6px] border text-left transition-colors ${
                  selectedProvider === "gmail"
                    ? "border-accent bg-accent/5 text-text-primary"
                    : "border-border bg-surface-secondary text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className="text-[13px] font-semibold">Gmail SMTP</div>
                <div className="text-[11.5px] text-text-muted mt-0.5">Native Google App Password connection</div>
              </button>
            </div>
          </div>

          {/* Coaching Persona / Tone Preference */}
          <div className="space-y-2 py-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <label className="text-[13px] font-medium text-text-primary">
                Coaching Dialogue Tone
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {COACHING_TONE_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setCoachingTone(opt.id)}
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    coachingTone === opt.id
                      ? "border-accent bg-accent/5 text-text-primary"
                      : "border-border bg-panel hover:bg-surface-hover text-text-secondary"
                  }`}
                >
                  <div className="text-[13px] font-medium text-text-primary flex items-center justify-between">
                    <span>{opt.label}</span>
                    {coachingTone === opt.id && <Badge variant="accent" className="text-[10px]">Active</Badge>}
                  </div>
                  <p className="text-[11.5px] text-text-muted mt-0.5">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* UI Feature Toggles */}
          <div className="space-y-3 pt-1">
            <div className="text-[12px] font-medium uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>Interface &amp; Cognitive Protocols</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-[13px] font-medium text-text-primary">Display Intent Badges</div>
                <p className="text-[11.5px] text-text-muted">
                  Show explicit cognitive focus tags (Salary, Interview, Imposter Syndrome) on assistant responses.
                </p>
              </div>
              <Switch checked={intentTags} onCheckedChange={setIntentTags} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-[13px] font-medium text-text-primary">Mandatory Micro-Experiments</div>
                <p className="text-[11.5px] text-text-muted">
                  Format every coaching response with an isolated daily behavioral challenge card.
                </p>
              </div>
              <Switch checked={microActions} onCheckedChange={setMicroActions} />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-5 border-t border-border bg-surface-secondary/20 flex items-center justify-between">
          <span className="text-[12px] text-text-muted">
            Preferences save automatically to your server account.
          </span>
          <Button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5 h-8 px-4"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Preferences</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
