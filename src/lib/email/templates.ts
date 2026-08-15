export interface WeeklyCheckinTemplateProps {
  userName: string;
  primaryGoal: string;
  reflectionSummary: string;
  recommendedMicroActions: string[];
  coachQuestion: string;
  appUrl: string;
}

export function renderWeeklyCheckinHtml(props: WeeklyCheckinTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Weekly Confidence Check-in</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #e8e8e8; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #161616; border: 1px solid #2a2a2a; border-radius: 6px; padding: 28px; }
    .header { font-size: 18px; font-weight: 600; color: #e8e8e8; margin-bottom: 20px; border-bottom: 1px solid #2a2a2a; padding-bottom: 14px; }
    .accent { color: #e07856; }
    .paragraph { font-size: 13.5px; line-height: 1.6; color: #e8e8e8; margin-bottom: 16px; }
    .card { background: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 4px; padding: 14px 18px; margin: 16px 0; }
    .action-item { font-size: 13px; color: #e8e8e8; margin: 8px 0; padding-left: 8px; border-left: 2px solid #e07856; }
    .cta-btn { display: inline-block; background: #e07856; color: #0d0d0d; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 13px; margin-top: 14px; }
    .footer { font-size: 11.5px; color: #5c5c5c; margin-top: 24px; border-top: 1px solid #2a2a2a; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      AI Confidence Coach <span class="accent">• Weekly Briefing</span>
    </div>
    
    <p class="paragraph">Hello ${props.userName},</p>
    <p class="paragraph">Here is your tailored coaching synthesis for this week centered on your focus: <strong>${props.primaryGoal}</strong>.</p>
    
    <div class="card">
      <div style="font-size: 12.5px; color: #8a8a8a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Weekly Synthesis</div>
      <p style="margin: 0; font-size: 13.5px; line-height: 1.5;">${props.reflectionSummary}</p>
    </div>

    <div style="margin: 20px 0;">
      <div style="font-size: 12.5px; color: #8a8a8a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Your Micro-Actions for the Week</div>
      ${props.recommendedMicroActions
        .map((action) => `<div class="action-item">${action}</div>`)
        .join("")}
    </div>

    <div class="card" style="border-color: #e07856;">
      <div style="font-size: 12.5px; color: #e07856; margin-bottom: 4px; font-weight: 500;">Coach Reflection Question</div>
      <p style="margin: 0; font-size: 13.5px;">"${props.coachQuestion}"</p>
    </div>

    <a href="${props.appUrl}/app/coach" class="cta-btn">Open AI Coach Workspace</a>

    <div class="footer">
      AI Confidence Coach • Automated weekly insight digest.<br/>
      Manage notification settings in your workspace dashboard.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function renderTestEmailHtml(userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; background: #0d0d0d; color: #e8e8e8; padding: 20px; }
    .box { max-width: 500px; background: #161616; border: 1px solid #2a2a2a; padding: 24px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="box">
    <h3 style="color: #3ecf5e; margin-top: 0;">✓ Email Integration Verified</h3>
    <p style="font-size: 13.5px; line-height: 1.5; color: #e8e8e8;">
      Hello ${userName}, this test message confirms that your email provider connection is active and ready to deliver coaching check-ins.
    </p>
  </div>
</body>
</html>
  `.trim();
}
