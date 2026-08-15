import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DenseRow } from "@/components/ui/dense-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-panel border-border">
        <CardHeader>
          <CardTitle className="text-[15px]">Account Overview</CardTitle>
        </CardHeader>
        <div>
          <DenseRow
            label="Authentication Provider"
            description="Managed securely via Clerk Authentication"
            action={<Badge variant="secondary">Clerk Active</Badge>}
          />
          <DenseRow
            label="Session Security"
            description="Multi-factor and session revocations handled in Clerk"
            action={<Button variant="secondary" size="sm">Manage Auth</Button>}
          />
          <DenseRow
            label="Data Export"
            description="Download all coaching conversation transcripts and micro-action logs"
            action={<Button variant="secondary" size="sm">Export JSON</Button>}
          />
        </div>
      </Card>
    </div>
  );
}
