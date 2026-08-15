import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="py-14">
      <Container size="narrow" className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">Privacy Policy</h1>
          <p className="text-[12.5px] text-text-secondary mt-1">Last updated: August 2026</p>
        </div>

        <Card className="bg-panel border-border">
          <CardHeader>
            <CardTitle className="text-[14px]">Data Protection & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px] text-text-secondary leading-relaxed">
            <p>
              Your coaching conversations, personal goals, and baseline metrics are confidential and stored securely in dedicated PostgreSQL databases.
            </p>
            <p>
              We do not sell personal reflection data or use your private conversations to train third-party public foundation models.
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
