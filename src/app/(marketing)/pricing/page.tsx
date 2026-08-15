import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";

export default function PricingPage() {
  return (
    <div className="py-14">
      <Container size="default" className="space-y-8">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">Transparent Pricing</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Predictable plans for individual growth and continuous confidence training.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <Card className="bg-panel border-border flex flex-col justify-between">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[15px]">Free Starter</CardTitle>
                  <Badge variant="secondary">Basic</Badge>
                </div>
                <div className="mt-3">
                  <span className="text-[22px] font-semibold text-text-primary">$0</span>
                  <span className="text-[12px] text-text-secondary"> / month</span>
                </div>
                <CardDescription className="text-[12.5px] mt-2">
                  Essential tools to assess confidence baseline and test AI coaching.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px] text-text-secondary">
                <div>✓ Standard AI confidence coaching sessions</div>
                <div>✓ Baseline profile assessment</div>
                <div>✓ Bi-weekly email summaries</div>
              </CardContent>
            </div>
            <CardFooter>
              <Link href={ROUTES.auth.signUp} className="w-full">
                <Button variant="secondary" className="w-full">
                  Get Started
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="bg-panel border-accent/40 flex flex-col justify-between relative">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[15px] text-text-primary">Pro Coaching</CardTitle>
                  <Badge variant="accent">Recommended</Badge>
                </div>
                <div className="mt-3">
                  <span className="text-[22px] font-semibold text-text-primary">$19</span>
                  <span className="text-[12px] text-text-secondary"> / month</span>
                </div>
                <CardDescription className="text-[12.5px] mt-2">
                  Full access to unlimited coaching, weekly automated syntheses, and custom email integrations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px] text-text-secondary">
                <div>✓ Unlimited NVIDIA NIM coaching completions</div>
                <div>✓ Weekly automated check-in digests</div>
                <div>✓ Custom Gmail SMTP & Resend connectors</div>
                <div>✓ Comprehensive historical progress analytics</div>
              </CardContent>
            </div>
            <CardFooter>
              <Link href={ROUTES.auth.signUp} className="w-full">
                <Button variant="default" className="w-full">
                  Subscribe to Pro
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </Container>
    </div>
  );
}
