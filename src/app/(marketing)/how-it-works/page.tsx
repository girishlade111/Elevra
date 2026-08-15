import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Establish Your Baseline & Goals",
      desc: "Complete the onboarding intake to record your focus areas (negotiation, public speaking, imposter syndrome) and set baseline confidence metrics.",
    },
    {
      step: "02",
      title: "Engage in Adaptive Coaching Sessions",
      desc: "Chat directly with the AI Coach powered by NVIDIA NIM. Receive structured responses complete with cognitive insights and actionable micro-experiments.",
    },
    {
      step: "03",
      title: "Execute Micro-Actions",
      desc: "Complete daily 5-to-15 minute real-world experiments to solidify confidence through repetitive behavioral proof.",
    },
    {
      step: "04",
      title: "Receive Automated Weekly Check-Ins",
      desc: "Every Monday morning, receive a personalized synthesis and reflection prompt delivered straight to your email inbox.",
    },
  ];

  return (
    <div className="py-14">
      <Container size="default" className="space-y-8">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">How It Works</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            A continuous loop of cognitive calibration, micro-action execution, and automated reflection.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((s) => (
            <Card key={s.step} className="bg-panel border-border">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="text-[13px] font-semibold text-accent px-2 py-0.5 rounded-[3px] border border-border bg-surface-secondary">
                    {s.step}
                  </div>
                  <div>
                    <CardTitle className="text-[14px]">{s.title}</CardTitle>
                    <CardDescription className="text-[12.5px] mt-1 text-text-secondary">
                      {s.desc}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
