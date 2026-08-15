import Link from "next/link";
import { User, Settings, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DenseRow } from "@/components/ui/dense-row";
import { ROUTES } from "@/config/routes";

export default function ProfilePage() {
  return (
    <div>
      <AppHeader
        title="Confidence Profile"
        description="Comprehensive summary of your calibration parameters, goals, and behavioral focus areas."
        actions={
          <Link href={ROUTES.app.settings.profile}>
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              <span>Edit Calibration</span>
            </Button>
          </Link>
        }
      />

      <div className="py-8">
        <Container size="default" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle className="text-[15px]">Active Calibration Profile</CardTitle>
            </CardHeader>
            <div>
              <DenseRow
                label="Primary Confidence Goal"
                description="Lead executive engineering architecture discussions with clear authority and minimal second-guessing."
              />
              <DenseRow
                label="Focus Domains"
                description="Public Speaking, Executive Presence, Imposter Syndrome"
              />
              <DenseRow
                label="Baseline Score"
                description="Initial rating: 6 / 10"
                action={<Badge variant="accent">Calibrated</Badge>}
              />
              <DenseRow
                label="Coaching Tone"
                description="Supportive & Rigorous (Cognitive Behavioral framework)"
              />
              <DenseRow
                label="Weekly Email Check-In"
                description="Active • Dispatches Mondays at 09:00 UTC"
                action={<Badge variant="success">Enabled</Badge>}
              />
            </div>
          </Card>
        </Container>
      </div>
    </div>
  );
}
