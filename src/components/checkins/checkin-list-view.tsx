"use client";

import * as React from "react";
import Link from "next/link";
import {
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Settings,
  ExternalLink,
  ChevronRight,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes";

export interface CheckinItem {
  id: string;
  provider: string;
  recipientEmail: string;
  subject: string;
  content: string;
  status: "pending" | "sent" | "failed" | "skipped";
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface CheckinListViewProps {
  checkins: CheckinItem[];
  emailConfigured: boolean;
  destinationEmail: string;
  provider: string;
}

export function CheckinListView({
  checkins,
  emailConfigured,
  destinationEmail,
  provider,
}: CheckinListViewProps) {
  const [selectedCheckin, setSelectedCheckin] = React.useState<CheckinItem | null>(null);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: CheckinItem["status"]) => {
    switch (status) {
      case "sent":
        return <Badge variant="success" className="capitalize">Sent</Badge>;
      case "failed":
        return <Badge variant="danger" className="capitalize">Failed</Badge>;
      case "skipped":
        return <Badge variant="outline" className="capitalize border-border text-text-muted">Skipped</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="capitalize border-accent/40 text-accent bg-accent/5">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule & Dispatch Overview Header Card */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 bg-surface-secondary/30">
          <div className="space-y-1">
            <div className="text-[11.5px] uppercase tracking-wider text-text-muted font-medium">
              Weekly AI Digest Delivery
            </div>
            <CardTitle className="text-[15px] font-semibold text-text-primary">
              Automated Check-In Schedule
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border bg-surface-secondary text-text-secondary text-[11.5px] capitalize">
              {provider} Engine
            </Badge>
            <Badge variant="accent" className="text-[11px]">
              Mondays 09:00 UTC
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-[13px] text-text-secondary leading-relaxed">
            {emailConfigured ? (
              <span>
                Weekly coaching digests synthesize your dialogues, active commitments, and micro-actions, delivered directly to{" "}
                <span className="text-text-primary font-medium">{destinationEmail}</span>.
              </span>
            ) : (
              <span>
                Weekly check-ins are currently paused or not configured. Set up your email connection to receive automated summaries.
              </span>
            )}
          </div>
          <Link href={ROUTES.app.settings.email} className="shrink-0">
            <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-surface-secondary border-border hover:bg-surface-hover">
              <Settings className="h-3.5 w-3.5" />
              <span>Email Settings</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Check-ins Log Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-[13.5px] font-medium text-text-primary">
            Dispatched Digest History ({checkins.length})
          </div>
        </div>

        {checkins.length === 0 ? (
          <Card className="bg-panel border-border text-center py-12 px-4 space-y-4">
            <div className="h-12 w-12 rounded-full bg-surface-secondary text-accent flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="text-[15px] font-semibold text-text-primary">
                No weekly check-ins dispatched yet
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Your first weekly digest will generate automatically at the next cron cycle (Monday 09:00 UTC) once you have active coaching conversations.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Link href={ROUTES.app.coach}>
                <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  <span>Start Coaching Session</span>
                </Button>
              </Link>
              <Link href={ROUTES.app.settings.email}>
                <Button variant="secondary" size="sm" className="bg-surface-secondary border-border hover:bg-surface-hover">
                  Configure Email
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {checkins.map((chk) => (
              <div
                key={chk.id}
                onClick={() => setSelectedCheckin(chk)}
                className="p-4 rounded-md border border-border bg-panel hover:bg-surface-hover hover:border-text-muted/40 transition-colors cursor-pointer space-y-2.5 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-[14px] font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                      {chk.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[11px] font-normal border-border bg-surface-secondary text-text-muted capitalize">
                      {chk.provider}
                    </Badge>
                    {getStatusBadge(chk.status)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-text-muted pt-1 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{chk.sentAt ? formatDate(chk.sentAt) : formatDate(chk.createdAt)}</span>
                    </div>
                    <span>•</span>
                    <span className="truncate">To: {chk.recipientEmail}</span>
                  </div>

                  <div className="flex items-center gap-1 text-text-secondary group-hover:text-text-primary text-[11.5px]">
                    <span>View summary</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-In Detail Modal / View */}
      {selectedCheckin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-md border border-border bg-panel text-text-primary shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[11px] font-normal border-border bg-surface-secondary text-text-muted capitalize">
                    {selectedCheckin.provider}
                  </Badge>
                  {getStatusBadge(selectedCheckin.status)}
                </div>
                <h3 className="text-[16px] font-semibold text-text-primary leading-snug pt-1">
                  {selectedCheckin.subject}
                </h3>
                <div className="text-[12px] text-text-muted flex items-center gap-2">
                  <span>To: {selectedCheckin.recipientEmail}</span>
                  <span>•</span>
                  <span>{selectedCheckin.sentAt ? formatDate(selectedCheckin.sentAt) : formatDate(selectedCheckin.createdAt)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCheckin(null)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-[13.5px] leading-relaxed">
              {selectedCheckin.errorMessage && (
                <div className="p-3 rounded border border-danger/30 bg-danger/10 text-danger text-[12.5px] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Delivery Warning</div>
                    <div>{selectedCheckin.errorMessage}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[11.5px] font-medium uppercase tracking-wider text-text-muted">
                  Email Body Content
                </div>
                <div className="rounded border border-border bg-surface-secondary/70 p-4 text-text-primary whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                  {selectedCheckin.content}
                </div>
              </div>

              {selectedCheckin.providerMessageId && (
                <div className="text-[11px] text-text-muted font-mono pt-1">
                  Provider Message ID: {selectedCheckin.providerMessageId}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-border bg-surface-secondary/30 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedCheckin(null)}
                className="h-8 text-[12px] bg-surface-secondary border-border hover:bg-surface-hover"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
