import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="py-14">
      <Container size="narrow" className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">Terms of Service</h1>
          <p className="text-[12.5px] text-text-secondary mt-1">Last updated: August 2026</p>
        </div>

        <Card className="bg-panel border-border">
          <CardHeader>
            <CardTitle className="text-[14px]">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px] text-text-secondary leading-relaxed">
            <p>
              AI Confidence Coach provides AI-assisted personal coaching and behavioral insights. It is not a substitute for clinical psychological treatment, medical diagnosis, or therapy.
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
