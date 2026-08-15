"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsPage() {
  const [formData, setFormData] = React.useState({
    fullName: "Alex Rivera",
    preferredName: "Alex",
    primaryGoal: "Lead executive architecture discussions with assertiveness and calm presence.",
    currentChallenge: "Hesitating before interjecting in group architecture reviews.",
    baselineScore: 6,
  });
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card className="bg-panel border-border">
      <CardHeader>
        <CardTitle className="text-[15px]">Confidence Calibration & Goals</CardTitle>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                Full Name
              </label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                Preferred Name
              </label>
              <Input
                value={formData.preferredName}
                onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13.5px] font-medium text-text-primary mb-1">
              Primary Goal
            </label>
            <Textarea
              value={formData.primaryGoal}
              onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[13.5px] font-medium text-text-primary mb-1">
              Current Immediate Challenge
            </label>
            <Textarea
              value={formData.currentChallenge}
              onChange={(e) => setFormData({ ...formData, currentChallenge: e.target.value })}
            />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <Button type="submit" size="sm">
            {saved ? "Saved Changes ✓" : "Save Calibration"}
          </Button>
          {saved && <span className="text-[12.5px] text-success">Profile updated successfully.</span>}
        </CardFooter>
      </form>
    </Card>
  );
}
