"use client";

import * as React from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Lock,
  ExternalLink,
  Info,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GmailConnectionInfo {
  email: string;
  isConnected: boolean;
  lastTestedAt: string | null;
}

interface EmailPreferencesInfo {
  provider: "resend" | "gmail";
  weeklyCheckinsEnabled: boolean;
  destinationEmail: string | null;
}

interface EmailSettingsViewProps {
  initialConnection: GmailConnectionInfo | null;
  initialPreferences: EmailPreferencesInfo | null;
  userEmail: string;
}

export function EmailSettingsView({
  initialConnection,
  initialPreferences,
  userEmail,
}: EmailSettingsViewProps) {
  // Active selected provider in UI
  const [activeProvider, setActiveProvider] = React.useState<"resend" | "gmail">(
    initialPreferences?.provider || (initialConnection?.isConnected ? "gmail" : "resend")
  );

  // Weekly check-in toggle & destination email
  const [weeklyEnabled, setWeeklyEnabled] = React.useState<boolean>(
    initialPreferences?.weeklyCheckinsEnabled ?? true
  );
  const [destinationEmail, setDestinationEmail] = React.useState<string>(
    initialPreferences?.destinationEmail || userEmail
  );
  const [savingPrefs, setSavingPrefs] = React.useState(false);
  const [prefsMessage, setPrefsMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Gmail connection state
  const [gmailConnection, setGmailConnection] = React.useState<GmailConnectionInfo | null>(
    initialConnection
  );
  const [gmailEmail, setGmailEmail] = React.useState(initialConnection?.email || userEmail);
  const [appPassword, setAppPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [connectingGmail, setConnectingGmail] = React.useState(false);
  const [gmailMessage, setGmailMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Test email state
  const [testRecipient, setTestRecipient] = React.useState(destinationEmail || userEmail);
  const [testingEmail, setTestingEmail] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Disconnect state
  const [disconnecting, setDisconnecting] = React.useState(false);

  // Format date helper
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Never tested";
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

  // Mask email for display (e.g. "al***@gmail.com")
  const maskEmailDisplay = (email: string) => {
    if (!email || !email.includes("@")) return email;
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${domain}`;
  };

  // 1. Save general delivery preferences
  const handleSavePreferences = async (newWeekly?: boolean, newProvider?: "resend" | "gmail") => {
    setSavingPrefs(true);
    setPrefsMessage(null);

    const targetWeekly = newWeekly !== undefined ? newWeekly : weeklyEnabled;
    const targetProvider = newProvider !== undefined ? newProvider : activeProvider;

    try {
      const res = await fetch("/api/email/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: targetProvider,
          weeklyCheckinsEnabled: targetWeekly,
          destinationEmail: destinationEmail.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setWeeklyEnabled(targetWeekly);
        setActiveProvider(targetProvider);
        setPrefsMessage({ type: "success", text: "Email delivery preferences updated successfully." });
      } else {
        setPrefsMessage({ type: "error", text: json.error?.message || "Failed to update preferences." });
      }
    } catch {
      setPrefsMessage({ type: "error", text: "Network error saving email preferences." });
    } finally {
      setSavingPrefs(false);
    }
  };

  // 2. Connect & Verify Gmail SMTP
  const handleConnectGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailEmail || !appPassword) {
      setGmailMessage({ type: "error", text: "Please provide your Gmail address and 16-character App Password." });
      return;
    }

    setConnectingGmail(true);
    setGmailMessage(null);

    try {
      const res = await fetch("/api/email/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gmail",
          email: gmailEmail.trim(),
          appPassword: appPassword.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setGmailConnection({
          email: json.data.email,
          isConnected: true,
          lastTestedAt: json.data.lastTestedAt || new Date().toISOString(),
        });
        setActiveProvider("gmail");
        setAppPassword(""); // Clear plaintext password immediately
        setGmailMessage({
          type: "success",
          text: "Gmail SMTP connected and verified successfully! Your App Password is securely encrypted.",
        });
      } else {
        setGmailMessage({
          type: "error",
          text: json.error?.message || "Gmail authentication failed. Please verify credentials.",
        });
      }
    } catch {
      setGmailMessage({ type: "error", text: "Failed to connect to Gmail service." });
    } finally {
      setConnectingGmail(false);
    }
  };

  // 3. Disconnect Gmail SMTP
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail? Stored credentials will be deleted permanently.")) {
      return;
    }

    setDisconnecting(true);
    setGmailMessage(null);

    try {
      const res = await fetch("/api/email/disconnect", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        setGmailConnection(null);
        setActiveProvider("resend");
        setGmailMessage({
          type: "success",
          text: "Gmail disconnected safely. Email credentials deleted from database.",
        });
      } else {
        setGmailMessage({ type: "error", text: json.error?.message || "Failed to disconnect Gmail." });
      }
    } catch {
      setGmailMessage({ type: "error", text: "Network error disconnecting Gmail." });
    } finally {
      setDisconnecting(false);
    }
  };

  // 4. Send Test Email
  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      setTestStatus({ type: "error", text: "Please enter a valid recipient address." });
      return;
    }

    setTestingEmail(true);
    setTestStatus(null);

    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: testRecipient.trim(),
          provider: activeProvider,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTestStatus({
          type: "success",
          text: `Verified test briefing delivered to ${testRecipient} via ${activeProvider.toUpperCase()}! Message ID: ${json.data?.messageId || "ok"}`,
        });
      } else {
        setTestStatus({
          type: "error",
          text: json.error?.message || "Failed to deliver test email. Please check provider settings.",
        });
      }
    } catch {
      setTestStatus({ type: "error", text: "Network error attempting test dispatch." });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Weekly Check-In Delivery Preferences */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 sm:p-5 border-b border-border/80 bg-surface-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[15px] font-semibold text-text-primary">
                Weekly Check-In Delivery
              </CardTitle>
              <CardDescription className="text-[12.5px] mt-0.5">
                Automated executive coaching briefings synthesized every Monday at 09:00 UTC.
              </CardDescription>
            </div>
            <Badge variant={weeklyEnabled ? "success" : "outline"} className="capitalize">
              {weeklyEnabled ? "Active" : "Paused"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {prefsMessage && (
            <div
              className={`p-3 rounded-[4px] border text-[12.5px] flex items-center gap-2 ${
                prefsMessage.type === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              {prefsMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{prefsMessage.text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/50">
            <div className="space-y-0.5">
              <div className="text-[13.5px] font-medium text-text-primary">
                Enable Automated Weekly Digest
              </div>
              <p className="text-[12px] text-text-secondary">
                Receive personalized action items, breakthrough insights, and reflection prompts.
              </p>
            </div>
            <Button
              type="button"
              variant={weeklyEnabled ? "secondary" : "default"}
              size="sm"
              onClick={() => handleSavePreferences(!weeklyEnabled)}
              disabled={savingPrefs}
              className="h-8 shrink-0"
            >
              {weeklyEnabled ? "Pause Check-Ins" : "Enable Check-Ins"}
            </Button>
          </div>

          <div className="space-y-2 pt-1">
            <label className="block text-[13px] font-medium text-text-primary">
              Destination Email Address
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Input
                type="email"
                value={destinationEmail}
                onChange={(e) => setDestinationEmail(e.target.value)}
                placeholder="you@domain.com"
                className="flex-1 bg-surface-secondary border-border"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleSavePreferences()}
                disabled={savingPrefs || !destinationEmail}
                className="h-9 px-4 bg-surface-secondary border-border hover:bg-surface-hover shrink-0"
              >
                {savingPrefs ? "Saving..." : "Save Address"}
              </Button>
            </div>
            <p className="text-[11.5px] text-text-muted">
              Weekly digests and test dispatches will be delivered to this verified inbox.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Provider Selection */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 sm:p-5 border-b border-border/80 bg-surface-secondary/20">
          <CardTitle className="text-[15px] font-semibold text-text-primary">
            Email Delivery Architecture
          </CardTitle>
          <CardDescription className="text-[12.5px] mt-0.5">
            Select your preferred server-side delivery engine. All sending and credential handling occurs strictly on the server.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option 1: Resend */}
            <div
              onClick={() => handleSavePreferences(undefined, "resend")}
              className={`p-4 rounded-md border text-left transition-all cursor-pointer space-y-2 select-none ${
                activeProvider === "resend"
                  ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                  : "border-border bg-panel hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-[13.5px] text-text-primary">
                    Option 1: Resend Platform
                  </span>
                </div>
                {activeProvider === "resend" && (
                  <Badge variant="accent" className="text-[10.5px]">Selected</Badge>
                )}
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Cloud transactional API using platform-configured verified sender domain. Zero client-side setup required.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Platform Managed</span>
              </div>
            </div>

            {/* Option 2: Gmail SMTP */}
            <div
              onClick={() => {
                if (gmailConnection?.isConnected) {
                  handleSavePreferences(undefined, "gmail");
                } else {
                  setActiveProvider("gmail");
                }
              }}
              className={`p-4 rounded-md border text-left transition-all cursor-pointer space-y-2 select-none ${
                activeProvider === "gmail"
                  ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                  : "border-border bg-panel hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-[13.5px] text-text-primary">
                    Option 2: Gmail SMTP
                  </span>
                </div>
                {activeProvider === "gmail" && (
                  <Badge variant="accent" className="text-[10.5px]">Selected</Badge>
                )}
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Native Nodemailer delivery using your personal Gmail address and encrypted 16-character Google App Password.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
                {gmailConnection?.isConnected ? (
                  <span className="text-success flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected: {maskEmailDisplay(gmailConnection.email)}
                  </span>
                ) : (
                  <span>Requires App Password Setup</span>
                )}
              </div>
            </div>
          </div>

          {/* Active Provider Specific Configuration */}
          {activeProvider === "resend" ? (
            <div className="p-4 rounded-md border border-border bg-surface-secondary/40 space-y-2 text-[12.5px] text-text-secondary">
              <div className="flex items-center gap-2 font-medium text-text-primary text-[13px]">
                <Info className="h-4 w-4 text-accent" />
                <span>Resend Configuration Details</span>
              </div>
              <p>
                Emails are securely routed through our verified transactional email infrastructure.
                Weekly check-ins will arrive with verified SPF/DKIM authentication.
              </p>
              <div className="text-[11.5px] text-text-muted pt-1">
                Recipient Target: <span className="text-text-primary font-mono">{destinationEmail || userEmail}</span>
              </div>
            </div>
          ) : (
            /* Gmail SMTP Configuration Card */
            <div className="p-4 rounded-md border border-border bg-surface-secondary/40 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-[13.5px] text-text-primary">
                    Gmail SMTP Credentials
                  </span>
                </div>
                {gmailConnection?.isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[11px]">Connected</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="h-7 text-[11.5px] border-danger/40 text-danger hover:bg-danger/10 gap-1 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{disconnecting ? "Disconnecting..." : "Disconnect"}</span>
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-[11px] text-text-muted border-border">
                    Not Connected
                  </Badge>
                )}
              </div>

              {gmailMessage && (
                <div
                  className={`p-3 rounded-[4px] border text-[12.5px] flex items-center gap-2 ${
                    gmailMessage.type === "success"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-danger/30 bg-danger/10 text-danger"
                  }`}
                >
                  {gmailMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{gmailMessage.text}</span>
                </div>
              )}

              {gmailConnection?.isConnected ? (
                <div className="space-y-2 text-[12.5px] text-text-secondary">
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span>Connected Gmail Address:</span>
                    <span className="font-mono text-text-primary font-medium">
                      {gmailConnection.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span>App Password Security:</span>
                    <span className="text-success font-medium flex items-center gap-1">
                      <Lock className="h-3 w-3" /> AES-256-GCM Encrypted
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Last Connection Verification:</span>
                    <span className="text-text-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(gmailConnection.lastTestedAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConnectGmail} className="space-y-3.5">
                  <div className="p-3 rounded border border-accent/20 bg-accent/5 text-[12px] text-text-secondary space-y-1">
                    <div className="font-medium text-text-primary flex items-center gap-1.5">
                      <span>How to generate a Google App Password:</span>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline flex items-center gap-0.5"
                      >
                        <span>Google Security</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <ol className="list-decimal pl-4 space-y-0.5 text-text-muted">
                      <li>Enable 2-Step Verification on your Google Account.</li>
                      <li>Visit <strong>Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords</strong>.</li>
                      <li>Create an app named &ldquo;Elevra&rdquo; and copy the 16-character code.</li>
                    </ol>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12.5px] font-medium text-text-primary">
                      Gmail Address
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="you@gmail.com"
                      value={gmailEmail}
                      onChange={(e) => setGmailEmail(e.target.value)}
                      className="bg-surface-secondary border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12.5px] font-medium text-text-primary">
                      16-Character Google App Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="abcd efgh ijkl mnop"
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        className="bg-surface-secondary border-border pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Your App Password is encrypted server-side with AES-256-GCM and never exposed to the client.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={connectingGmail || !gmailEmail || !appPassword}
                    className="w-full bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5 h-9"
                  >
                    {connectingGmail ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying with Google SMTP...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Connect &amp; Verify Gmail</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Send Test Email Verification */}
      <Card className="bg-panel border-border">
        <CardHeader className="p-4 sm:p-5 border-b border-border/80 bg-surface-secondary/20">
          <CardTitle className="text-[15px] font-semibold text-text-primary">
            Dispatch Test Email
          </CardTitle>
          <CardDescription className="text-[12.5px] mt-0.5">
            Trigger a real server-side email dispatch using your active provider ({activeProvider.toUpperCase()}) to confirm end-to-end delivery.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="flex-1 bg-surface-secondary border-border"
            />
            <Button
              onClick={handleSendTestEmail}
              disabled={testingEmail || !testRecipient}
              className="bg-accent hover:bg-accent-hover text-accent-foreground gap-1.5 h-9 px-4 shrink-0"
            >
              {testingEmail ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </Button>
          </div>

          {testStatus && (
            <div
              className={`p-3 rounded-[4px] border text-[12.5px] flex items-start gap-2 ${
                testStatus.type === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              {testStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testStatus.text}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
