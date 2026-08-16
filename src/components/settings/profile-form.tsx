"use client";

import * as React from "react";
import { Lock, CheckCircle2, AlertCircle, RefreshCw, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const CAREER_STAGE_OPTIONS = [
  "Foundational / Early Career",
  "Mid-Level Professional",
  "Senior Lead / Manager",
  "Executive / Director",
  "Founder / C-Suite",
] as const;

interface ProfileFormData {
  name: string;
  email: string;
  careerStage: string;
  challenge: string;
  monthlyGoal: string;
}

interface ProfileFormProps {
  initialData: ProfileFormData;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [formData, setFormData] = React.useState<ProfileFormData>(initialData);
  const [saving, setSaving] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          careerStage: formData.careerStage,
          challenge: formData.challenge.trim(),
          monthlyGoal: formData.monthlyGoal.trim(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        setStatusMessage({
          type: "success",
          text: "Profile and career goals updated successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: json.error?.message || "Failed to update profile.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error saving profile changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-panel border-border">
      <CardHeader className="p-4 sm:p-5 border-b border-border/80 bg-surface-secondary/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[15px] font-semibold text-text-primary">
              Profile &amp; Career Calibration
            </CardTitle>
            <CardDescription className="text-[12.5px] mt-0.5">
              These attributes parameterize every AI coaching dialogue and weekly synthesis digest.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-border text-text-muted text-[11px]">
            Server Synchronized
          </Badge>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 sm:p-5 space-y-4">
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

          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="profile-full-name" className="block text-[13px] font-medium text-text-primary">
                Full Name
              </label>
              <Input
                id="profile-full-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
                className="bg-surface-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-email" className="block text-[13px] font-medium text-text-primary">
                  Email Address
                </label>
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Managed via Clerk
                </span>
              </div>
              <Input
                id="profile-email"
                type="email"
                disabled
                value={formData.email}
                className="bg-surface-secondary/50 border-border text-text-muted cursor-not-allowed"
              />
            </div>
          </div>

          {/* Career Stage Selector */}
          <div className="space-y-1">
            <label htmlFor="profile-career-stage" className="block text-[13px] font-medium text-text-primary">
              Career Stage
            </label>
            <select
              id="profile-career-stage"
              value={formData.careerStage}
              onChange={(e) => setFormData({ ...formData, careerStage: e.target.value })}
              className="w-full h-9 rounded-md border border-border bg-surface-secondary px-3 py-1 text-[13.5px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="" disabled>Select your career stage</option>
              {CAREER_STAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-panel text-text-primary">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Challenge */}
          <div className="space-y-1">
            <label htmlFor="profile-challenge" className="block text-[13px] font-medium text-text-primary">
              Primary Immediate Challenge
            </label>
            <Textarea
              id="profile-challenge"
              required
              rows={3}
              value={formData.challenge}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              placeholder="e.g. Hesitating before interjecting in leadership meetings and second-guessing recommendations."
              className="bg-surface-secondary border-border resize-none text-[13px] leading-relaxed"
            />
            <p className="text-[11.5px] text-text-muted">
              The AI coach uses this to frame micro-challenges and cognitive reframing scenarios.
            </p>
          </div>

          {/* Current Monthly Goal */}
          <div className="space-y-1">
            <label htmlFor="profile-monthly-goal" className="block text-[13px] font-medium text-text-primary">
              Current Monthly Objective
            </label>
            <Textarea
              id="profile-monthly-goal"
              required
              rows={3}
              value={formData.monthlyGoal}
              onChange={(e) => setFormData({ ...formData, monthlyGoal: e.target.value })}
              placeholder="e.g. Speak with conviction in Q3 strategic planning and anchor compensation target."
              className="bg-surface-secondary border-border resize-none text-[13px] leading-relaxed"
            />
            <p className="text-[11.5px] text-text-muted">
              Reviewed in your weekly check-ins and overview dashboard.
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-5 border-t border-border bg-surface-secondary/20 flex items-center justify-between">
          <span className="text-[12px] text-text-muted">
            All updates synchronize immediately across coaching sessions.
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
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
