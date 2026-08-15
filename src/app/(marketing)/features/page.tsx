import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FeaturesPage() {
  const features = [
    {
      name: "Adaptive Intent Classifier",
      badge: "Core AI",
      description: "Automatically analyzes user prompts to differentiate between roleplay rehearsals, cognitive reframing, emergency pre-meeting grounding, and structured goal planning.",
    },
    {
      name: "Micro-Action Accountability",
      badge: "Behavioral Science",
      description: "Generates bite-sized 5-15 minute daily growth challenges to build practical self-efficacy rather than passive theory.",
    },
    {
      name: "Weekly Digest Engine",
      badge: "Automation",
      description: "Vercel Cron triggers automated syntheses summarizing conversational breakthroughs and queuing relevant follow-up actions directly to email.",
    },
    {
      name: "Dual Email Provider Architecture",
      badge: "Infrastructure",
      description: "Pluggable provider adapter supporting both Resend transactional APIs and native Gmail SMTP with secure App Passwords.",
    },
  ];

  return (
    <div className="py-14">
      <Container size="default" className="space-y-8">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">System Features</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Engineered capabilities designed for sustainable behavioral growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <Card key={f.name} className="bg-panel border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px]">{f.name}</CardTitle>
                  <Badge variant="accent">{f.badge}</Badge>
                </div>
                <CardDescription className="text-[12.5px] mt-2 text-text-secondary leading-relaxed">
                  {f.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
