import { TrendingUp, CheckCircle, Award } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

export default function ProgressPage() {
  const metricRecords = [
    { area: "Public Speaking", baseline: 5, current: 8, completedActions: 6, trend: "+3.0" },
    { area: "Career Negotiation", baseline: 4, current: 7, completedActions: 4, trend: "+3.0" },
    { area: "Imposter Syndrome Reframing", baseline: 3, current: 6, completedActions: 9, trend: "+3.0" },
    { area: "Executive Presence", baseline: 5, current: 7, completedActions: 5, trend: "+2.0" },
  ];

  return (
    <div>
      <AppHeader
        title="Confidence Growth & Progress"
        description="Empirical tracking of baseline scores, behavioral experiments, and consistency metrics."
      />

      <div className="py-8">
        <Container size="default" className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-secondary">Overall Growth Score</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold text-text-primary">+2.8</span>
                  <span className="text-[12px] text-success">Positive Delta</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-secondary">Total Experiments Logged</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold text-text-primary">24</span>
                  <span className="text-[12px] text-text-muted">Micro-actions</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-4 space-y-1">
                <div className="text-[12px] text-text-secondary">Weekly Digest Streak</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold text-text-primary">4 Weeks</span>
                  <span className="text-[12px] text-accent">Active</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Breakdown Table */}
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle className="text-[15px]">Focus Domain Progression</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confidence Focus Domain</TableHead>
                  <TableHead>Baseline</TableHead>
                  <TableHead>Current Level</TableHead>
                  <TableHead>Completed Actions</TableHead>
                  <TableHead>Progress Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricRecords.map((m) => (
                  <TableRow key={m.area}>
                    <TableCell className="font-medium">{m.area}</TableCell>
                    <TableCell className="text-text-secondary">{m.baseline} / 10</TableCell>
                    <TableCell className="text-text-primary font-semibold">{m.current} / 10</TableCell>
                    <TableCell className="text-text-secondary">{m.completedActions}</TableCell>
                    <TableCell>
                      <Badge variant="success">{m.trend}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Container>
      </div>
    </div>
  );
}
