"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Sliders,
  Download,
  Trash2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DenseRow } from "@/components/ui/dense-row";
import { ROUTES } from "@/config/routes";

interface SettingsHubViewProps {
  userName: string;
  userEmail: string;
  careerStage: string;
  challenge: string;
  emailProvider: string;
  weeklyCheckinsEnabled: boolean;
  hasGmailConnected: boolean;
}

export function SettingsHubView({
  userName,
  userEmail,
  careerStage,
  challenge,
  emailProvider,
  weeklyCheckinsEnabled,
  hasGmailConnected,
}: SettingsHubViewProps) {
  const [exporting, setExporting] = React.useState(false);
  const [clearingHistory, setClearingHistory] = React.useState(false);
  const [wipingData, setWipingData] = React.useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = React.useState(false);

  const [confirmClearModal, setConfirmClearModal] = React.useState(false);
  const [confirmWipeModal, setConfirmWipeModal] = React.useState(false);
  const [wipeConfirmText, setWipeConfirmText] = React.useState("");

  const [actionMessage, setActionMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Export Data
  const handleExportData = async () => {
    setExporting(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/account/export", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `elevra-data-export-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        setActionMessage({
          type: "success",
          text: "Full account data bundle downloaded successfully.",
        });
      } else {
        setActionMessage({
          type: "error",
          text: json.error?.message || "Failed to export account data.",
        });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error exporting data." });
    } finally {
      setExporting(false);
    }
  };

  // 2. Clear Conversation History
  const handleClearHistory = async () => {
    setClearingHistory(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/account/clear-history", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        setConfirmClearModal(false);
        setActionMessage({
          type: "success",
          text: "All coaching dialogues and message logs cleared successfully.",
        });
      } else {
        setActionMessage({
          type: "error",
          text: json.error?.message || "Failed to clear history.",
        });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error clearing history." });
    } finally {
      setClearingHistory(false);
    }
  };

  // 3. Disconnect Gmail
  const handleDisconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail? Stored credentials will be deleted permanently.")) {
      return;
    }

    setDisconnectingGmail(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/email/disconnect", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        setActionMessage({
          type: "success",
          text: "Gmail disconnected safely. Credentials deleted from database.",
        });
      } else {
        setActionMessage({
          type: "error",
          text: json.error?.message || "Failed to disconnect Gmail.",
        });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error disconnecting Gmail." });
    } finally {
      setDisconnectingGmail(false);
    }
  };

  // 4. Wipe Database Data
  const handleWipeData = async () => {
    if (wipeConfirmText !== "DELETE MY DATA") {
      alert("Please type 'DELETE MY DATA' to confirm.");
      return;
    }

    setWipingData(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        setConfirmWipeModal(false);
        setActionMessage({
          type: "success",
          text: "Application database wiped successfully. You may now sign out or delete your Clerk identity.",
        });
      } else {
        setActionMessage({
          type: "error",
          text: json.error?.message || "Failed to wipe data.",
        });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error wiping data." });
    } finally {
      setWipingData(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {actionMessage && (
        <div
          className={`p-3.5 rounded-[4px] border text-[13px] flex items-center gap-2.5 ${
            actionMessage.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 1. Profile & Career Calibration */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 border-b border-border/80 bg-surface-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <CardTitle className="text-[14.5px] font-semibold text-text-primary">
                Profile &amp; Career Calibration
              </CardTitle>
            </div>
            <Link href={ROUTES.app.settings.profile}>
              <Button variant="secondary" size="sm" className="h-7 text-[11.5px] gap-1 bg-surface-secondary border-border hover:bg-surface-hover">
                <span>Manage Profile</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <div>
          <DenseRow
            label="Client Identity"
            description={`${userName} • ${userEmail}`}
            action={<Badge variant="outline" className="text-[11px] border-border text-text-muted">Clerk Synced</Badge>}
          />
          <DenseRow
            label="Career Stage"
            description={careerStage}
          />
          <DenseRow
            label="Primary Behavioral Challenge"
            description={challenge}
            action={<Badge variant="accent" className="text-[10.5px]">Active Focus</Badge>}
          />
        </div>
      </Card>

      {/* 2. Email Delivery & Check-Ins */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 border-b border-border/80 bg-surface-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              <CardTitle className="text-[14.5px] font-semibold text-text-primary">
                Email Delivery &amp; Weekly Check-Ins
              </CardTitle>
            </div>
            <Link href={ROUTES.app.settings.email}>
              <Button variant="secondary" size="sm" className="h-7 text-[11.5px] gap-1 bg-surface-secondary border-border hover:bg-surface-hover">
                <span>Configure Email</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <div>
          <DenseRow
            label="Active Email Provider"
            description={emailProvider === "gmail" ? "Gmail SMTP (Personal App Password)" : "Resend Transactional Platform"}
            action={
              <Badge variant="outline" className="text-[11px] capitalize border-border bg-surface-secondary text-text-secondary">
                {emailProvider}
              </Badge>
            }
          />
          <DenseRow
            label="Automated Monday Digest"
            description="Personalized cognitive synthesis sent every Monday at 09:00 UTC"
            action={
              <Badge variant={weeklyCheckinsEnabled ? "success" : "outline"} className="text-[11px] capitalize">
                {weeklyCheckinsEnabled ? "Active" : "Paused"}
              </Badge>
            }
          />
        </div>
      </Card>

      {/* 3. Coaching Preferences */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 border-b border-border/80 bg-surface-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-accent" />
              <CardTitle className="text-[14.5px] font-semibold text-text-primary">
                Coaching Experience &amp; Tone
              </CardTitle>
            </div>
            <Link href={ROUTES.app.settings.preferences}>
              <Button variant="secondary" size="sm" className="h-7 text-[11.5px] gap-1 bg-surface-secondary border-border hover:bg-surface-hover">
                <span>Edit Preferences</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <div>
          <DenseRow
            label="Coaching Protocol"
            description="Cognitive Behavioral Therapy (CBT) + Assertiveness Exposure Framework"
            action={<Badge variant="outline" className="text-[11px] border-border text-text-muted">CBT Active</Badge>}
          />
          <DenseRow
            label="Daily Micro-Action Policy"
            description="Every response includes a 5-15 minute actionable experiment"
          />
        </div>
      </Card>

      {/* 4. Privacy & Data Portability */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 border-b border-border/80 bg-surface-secondary/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <CardTitle className="text-[14.5px] font-semibold text-text-primary">
              Privacy &amp; Data Portability
            </CardTitle>
          </div>
        </CardHeader>
        <div>
          <DenseRow
            label="Export Account Data"
            description="Download all coaching dialogues, message transcripts, and check-in history as JSON"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportData}
                disabled={exporting}
                className="h-7 text-[11.5px] gap-1.5 bg-surface-secondary border-border hover:bg-surface-hover"
              >
                {exporting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                <span>{exporting ? "Exporting..." : "Export JSON"}</span>
              </Button>
            }
          />
          <DenseRow
            label="Clear Conversation History"
            description="Purge all chat sessions and message exchanges from database while preserving your profile"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClearModal(true)}
                className="h-7 text-[11.5px] border-border text-text-secondary hover:text-danger hover:border-danger/40"
              >
                Clear History
              </Button>
            }
          />
        </div>
      </Card>

      {/* 5. Danger Zone */}
      <Card className="bg-panel border-danger/40">
        <CardHeader className="p-4 border-b border-danger/30 bg-danger/5">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-4 w-4" />
            <CardTitle className="text-[14.5px] font-semibold text-danger">
              Danger Zone
            </CardTitle>
          </div>
          <CardDescription className="text-[12px] text-text-muted mt-0.5">
            Irreversible destructive actions and account data wipe controls.
          </CardDescription>
        </CardHeader>

        <div>
          {hasGmailConnected && (
            <DenseRow
              label="Disconnect Gmail Credentials"
              description="Permanently delete encrypted Google App Password from database"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGmail}
                  disabled={disconnectingGmail}
                  className="h-7 text-[11.5px] border-danger/30 text-danger hover:bg-danger/10"
                >
                  {disconnectingGmail ? "Disconnecting..." : "Disconnect Gmail"}
                </Button>
              }
            />
          )}

          <DenseRow
            label="Application Database Wipe"
            description="Permanently erase all conversations, check-ins, AI tokens, and profile calibration"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmWipeModal(true)}
                className="h-7 text-[11.5px] border-danger/40 text-danger hover:bg-danger/10 gap-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Wipe Data</span>
              </Button>
            }
          />

          <DenseRow
            label="Clerk Authentication Account"
            description="Manage your underlying Clerk identity, password, multi-factor auth, or full Clerk account deletion"
            action={
              <Badge variant="outline" className="text-[11px] border-border bg-surface-secondary text-text-muted flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Clerk Portal</span>
              </Badge>
            }
          />
        </div>
      </Card>

      {/* Clear History Confirmation Modal */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-md border border-border bg-panel text-text-primary p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-[16px] font-semibold text-text-primary">Clear Conversation History?</h3>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              This will permanently delete all coaching conversations and dialogue messages. Your calibration goals and email settings will remain intact.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmClearModal(false)}
                disabled={clearingHistory}
                className="h-8 bg-surface-secondary border-border"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleClearHistory}
                disabled={clearingHistory}
                className="h-8 bg-danger text-white hover:bg-danger/90"
              >
                {clearingHistory ? "Clearing..." : "Yes, Clear All Conversations"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Data Confirmation Modal */}
      {confirmWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-md border border-danger/40 bg-panel text-text-primary p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-[16px] font-semibold text-text-primary">Permanently Wipe Application Data?</h3>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              This will permanently erase all coaching sessions, email configurations, weekly check-in logs, and profile records from the database.
            </p>
            <div className="space-y-1 pt-1">
              <label className="block text-[12px] font-medium text-text-muted">
                Type <span className="font-mono text-danger font-semibold">DELETE MY DATA</span> to confirm:
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="DELETE MY DATA"
                className="w-full h-8 rounded border border-border bg-surface-secondary px-2.5 text-[12.5px] font-mono text-text-primary focus:outline-none focus:border-danger"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmWipeModal(false)}
                disabled={wipingData}
                className="h-8 bg-surface-secondary border-border"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleWipeData}
                disabled={wipingData || wipeConfirmText !== "DELETE MY DATA"}
                className="h-8 bg-danger text-white hover:bg-danger/90"
              >
                {wipingData ? "Wiping Data..." : "Permanently Wipe Data"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
