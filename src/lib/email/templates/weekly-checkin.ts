/**
 * @fileoverview Weekly Check-In Digest Email Template.
 * Dispatched on automated cron schedule synthesizing coaching dialogues.
 */

export interface WeeklyCheckinEmailData {
  userName: string;
  subject: string;
  greeting: string;
  progress_acknowledgment: string;
  weekly_challenge: string;
  motivational_quote: string;
  closing: string;
  appUrl: string;
  monthlyGoal?: string | null;
  careerStage?: string | null;
}

export function renderWeeklyCheckinHtml(data: WeeklyCheckinEmailData): string {
  const goalSection = data.monthlyGoal
    ? `
      <div style="background-color: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 6px; padding: 14px 16px; margin: 16px 0;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8a8a; font-weight: 600; margin-bottom: 4px;">
          Active Monthly Focus
        </div>
        <div style="font-size: 13.5px; color: #e8e8e8; font-weight: 500;">
          ${data.monthlyGoal}
        </div>
      </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #e8e8e8; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 580px; margin: 0 auto; background-color: #161616; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
    .header { padding: 24px; border-bottom: 1px solid #2a2a2a; background-color: #1c1c1c; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 15px; font-weight: 700; color: #e8e8e8; }
    .logo-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #e07856; margin-right: 6px; }
    .content { padding: 28px 24px; }
    .title { font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 8px 0; }
    .greeting { font-size: 14.5px; font-weight: 500; color: #e8e8e8; margin-bottom: 14px; }
    .section-title { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8a8a; margin: 22px 0 8px 0; }
    .challenge-card { background-color: #1c1c1c; border: 1px solid #2a2a2a; border-left: 3px solid #e07856; border-radius: 4px; padding: 16px; margin: 12px 0; }
    .challenge-desc { font-size: 13.5px; color: #e8e8e8; margin: 0; line-height: 1.5; }
    .quote-card { background-color: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 4px; padding: 16px; margin: 16px 0; font-style: italic; color: #b3b3b3; font-size: 13px; text-align: center; }
    .closing { font-size: 13.5px; color: #8a8a8a; margin-top: 20px; white-space: pre-line; }
    .cta-btn { display: inline-block; background-color: #e07856; color: #0d0d0d; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin-top: 20px; }
    .footer { padding: 20px 24px; border-top: 1px solid #2a2a2a; font-size: 11.5px; color: #5c5c5c; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="logo-dot"></span>Elevra</div>
      <div style="font-size: 11.5px; color: #8a8a8a; font-weight: 500;">Weekly Coaching Digest</div>
    </div>
    <div class="content">
      <h1 class="title">Weekly Executive Check-In</h1>
      <div class="greeting">${data.greeting}</div>

      <p style="font-size: 13.5px; color: #e8e8e8; line-height: 1.6; margin-bottom: 16px;">
        ${data.progress_acknowledgment}
      </p>

      ${goalSection}

      <div class="section-title">This Week's Micro-Challenge</div>
      <div class="challenge-card">
        <p class="challenge-desc">${data.weekly_challenge}</p>
      </div>

      <div class="quote-card">
        &ldquo;${data.motivational_quote}&rdquo;
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.appUrl}/app" class="cta-btn">Open Your Coaching Workspace</a>
      </div>

      <div class="closing">${data.closing}</div>
    </div>
    <div class="footer">
      Elevra • Confidential Executive &amp; Cognitive Behavioral Coaching
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function renderWeeklyCheckinText(data: WeeklyCheckinEmailData): string {
  return `
ELEVRA • WEEKLY EXECUTIVE CHECK-IN
${data.subject}

${data.greeting}

${data.progress_acknowledgment}

${data.monthlyGoal ? `Active Monthly Goal: ${data.monthlyGoal}\n` : ""}
THIS WEEK'S MICRO-CHALLENGE:
${data.weekly_challenge}

WEEKLY REFLECTION:
"${data.motivational_quote}"

Open your coaching workspace: ${data.appUrl}/app

${data.closing}
  `.trim();
}
