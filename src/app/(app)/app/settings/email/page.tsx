"use client";

import * as React from "react";
import { Mail, Check, AlertCircle, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DenseRow } from "@/components/ui/dense-row";

export default function EmailSettingsPage() {
  const [provider, setProvider] = React.useState<"resend" | "gmail_smtp">("resend");
  const [resendApiKey, setResendApiKey] = React.useState("");
  const [resendFromEmail, setResendFromEmail] = React.useState("coach@example.com");
  const [gmailUser, setGmailUser] = React.useState("");
  const [gmailPass, setGmailPass] = React.useState("");
  const [testEmail, setTestEmail] = React.useState("");
  const [testStatus, setTestStatus] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);

  const handleTestDispatch = async () => {
    if (!testEmail) return;
    setTesting(true);
    setTestStatus(null);

    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testEmail, provider }),
      });

      const json = await res.json();
      if (json.success) {
        setTestStatus("Success: Test briefing delivered!");
      } else {
        setTestStatus(`Failed: ${json.error?.message || "Check credentials in .env"}`);
      }
    } catch (e) {
      setTestStatus("Error: Failed to connect to email endpoint");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selector */}
      <Card className="bg-panel border-border">
        <CardHeader>
          <CardTitle className="text-[15px]">Select Email Delivery Architecture</CardTitle>
          <CardDescription className="text-[12.5px] mt-1">
            Choose whether to deliver weekly check-ins via Resend Transactional API or Gmail SMTP with App Passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("resend")}
              className={`p-4 rounded-[6px] border text-left transition-colors ${
                provider === "resend"
                  ? "border-accent bg-accent/5 text-text-primary"
                  : "border-border bg-surface-secondary text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[13.5px]">Option 1: Resend API</span>
                {provider === "resend" && <Badge variant="accent">Active</Badge>}
              </div>
              <p className="text-[12px] text-text-secondary mt-1">
                Cloud transactional email service with domain verification.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setProvider("gmail_smtp")}
              className={`p-4 rounded-[6px] border text-left transition-colors ${
                provider === "gmail_smtp"
                  ? "border-accent bg-accent/5 text-text-primary"
                  : "border-border bg-surface-secondary text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[13.5px]">Option 2: Gmail SMTP</span>
                {provider === "gmail_smtp" && <Badge variant="accent">Active</Badge>}
              </div>
              <p className="text-[12px] text-text-secondary mt-1">
                Native Nodemailer integration via personal Google App Password.
              </p>
            </button>
          </div>

          {/* Provider Specific Inputs */}
          {provider === "resend" ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                  Resend API Key (Optional override if set in .env)
                </label>
                <Input
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxx"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                  From Email Address
                </label>
                <Input
                  type="email"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                  Gmail User Email
                </label>
                <Input
                  type="email"
                  placeholder="you@gmail.com"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[13.5px] font-medium text-text-primary mb-1">
                  16-Character Google App Password
                </label>
                <Input
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={gmailPass}
                  onChange={(e) => setGmailPass(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Email Dispatch Panel */}
      <Card className="bg-panel border-border">
        <CardHeader>
          <CardTitle className="text-[15px]">Test Email Delivery</CardTitle>
          <CardDescription className="text-[12.5px] mt-1">
            Dispatch a verified test check-in message to confirm provider connectivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleTestDispatch}
              disabled={testing || !testEmail}
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{testing ? "Sending..." : "Send Test"}</span>
            </Button>
          </div>

          {testStatus && (
            <div className="p-2.5 rounded-[4px] border border-border bg-surface-secondary text-[12.5px] text-text-primary">
              {testStatus}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
