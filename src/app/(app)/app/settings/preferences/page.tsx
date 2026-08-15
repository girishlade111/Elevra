"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DenseRow } from "@/components/ui/dense-row";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function PreferencesPage() {
  const [weeklyDigest, setWeeklyDigest] = React.useState(true);
  const [intentTags, setIntentTags] = React.useState(true);
  const [microActions, setMicroActions] = React.useState(true);

  return (
    <div className="space-y-6">
      <Card className="bg-panel border-border">
        <CardHeader>
          <CardTitle className="text-[15px]">Coaching Experience Preferences</CardTitle>
        </CardHeader>
        <div>
          <DenseRow
            label="Weekly Email Synthesis Digest"
            description="Automatically receive personalized progress reports on Monday mornings"
            action={<Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />}
          />
          <DenseRow
            label="Display Cognitive Intent Tags"
            description="Show explicit classification tags (roleplay, reframing, planning) on AI responses"
            action={<Switch checked={intentTags} onCheckedChange={setIntentTags} />}
          />
          <DenseRow
            label="Enforce Micro-Action Generation"
            description="Require AI Coach to output 5-15 minute daily behavioral experiments"
            action={<Switch checked={microActions} onCheckedChange={setMicroActions} />}
          />
          <DenseRow
            label="Coaching Protocol"
            description="Cognitive Behavioral Calibration (CBT + Exposure Framework)"
            action={<Badge variant="accent">CBT Core Active</Badge>}
          />
        </div>
      </Card>
    </div>
  );
}
