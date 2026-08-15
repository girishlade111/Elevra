import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="py-14">
      <Container size="narrow" className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">About AI Confidence Coach</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Re-architecting cognitive coaching into structured, daily behavioral experiments.
          </p>
        </div>

        <Card className="bg-panel border-border">
          <CardHeader>
            <CardTitle className="text-[14px]">Mission & Architectural Principles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-[13px] text-text-secondary leading-relaxed">
            <p>
              Confidence is not an innate genetic trait; it is a measurable behavioral skillset built through repeated, low-stakes exposure and progressive desensitization to self-doubt.
            </p>
            <p>
              AI Confidence Coach was engineered to provide instant, structured reflection and micro-action generation without the noise of generic chatbots.
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
