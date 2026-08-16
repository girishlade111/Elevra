/**
 * @fileoverview Weekly Check-In Digest Email Template.
 * Dispatched on automated cron schedule synthesizing coaching dialogues.
 */

export interface WeeklyCheckinEmailData {
  userName: string;
  weekLabel: string;
  activeGoal: string;
  keyInsights: string[];
  recommendedMicroAction: {
    title: string;
    description: string;
    estimatedMinutes?: number;
  };
  reflectionPrompt: string;
  appUrl: string;
}

export function renderWeeklyCheckinHtml(data: WeeklyCheckinEmailData): string {
  const insightsList = data.keyInsights
    .map(
      (insight) =>
        `<li style="margin-bottom: 6px; color: #e8e8e8; font-size: 13px;">${insight}</li>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elevra - ${data.weekLabel} Coaching Briefing</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #e8e8e8; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 580px; margin: 0 auto; background-color: #161616; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
    .header { padding: 24px; border-bottom: 1px solid #2a2a2a; background-color: #1c1c1c; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 15px; font-weight: 700; color: #e8e8e8; }
    .logo-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #e07856; margin-right: 6px; }
    .content { padding: 28px 24px; }
    .title { font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 4px 0; }
    .subtitle { font-size: 12.5px; color: #8a8a8a; margin-bottom: 20px; }
    .section-title { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8a8a; margin: 20px 0 8px 0; }
    .action-card { background-color: #1c1c1c; border: 1px solid #2a2a2a; border-left: 3px solid #e07856; border-radius: 4px; padding: 16px; margin: 12px 0; }
    .action-title { font-size: 14px; font-weight: 600; color: #e07856; margin-bottom: 4px; }
    .action-desc { font-size: 13px; color: #e8e8e8; margin: 0; }
    .reflection-card { background-color: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 4px; padding: 14px; margin: 12px 0; font-style: italic; color: #8a8a8a; font-size: 13px; }
    .cta-btn { display: inline-block; background-color: #e07856; color: #0d0d0d; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 4px; text-decoration: none; margin-top: 16px; }
    .footer { padding: 20px 24px; border-top: 1px solid #2a2a2a; font-size: 11.5px; color: #5c5c5c; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="logo-dot"></span>Elevra</div>
      <div style="font-size: 12px; color: #8a8a8a;">${data.weekLabel}</div>
    </div>
    <div class="content">
      <h1 class="title">Weekly Executive Confidence Synthesis</h1>
      <div class="subtitle">Prepared for ${data.userName} • Active Goal: ${data.activeGoal}</div>

      <div class="section-title">Key Breakthrough Insights</div>
      <ul style="padding-left: 20px; margin: 8px 0 16px 0;">
        ${insightsList}
      </ul>

      <div class="section-title">Recommended Micro-Action</div>
      <div class="action-card">
        <div class="action-title">${data.recommendedMicroAction.title}</div>
        <p class="action-desc">${data.recommendedMicroAction.description}</p>
      </div>

      <div class="section-title">Weekly Reflection Prompt</div>
      <div class="reflection-card">
        &ldquo;${data.reflectionPrompt}&rdquo;
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${data.appUrl}/app" class="cta-btn">Open Elevra Workspace</a>
      </div>
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
  const insights = data.keyInsights.map((i) => `• ${i}`).join("\n");

  return `
ELEVRA • WEEKLY EXECUTIVE CONFIDENCE SYNTHESIS
${data.weekLabel} for ${data.userName}
Active Goal: ${data.activeGoal}

KEY INSIGHTS:
${insights}

RECOMMENDED MICRO-ACTION:
${data.recommendedMicroAction.title}
${data.recommendedMicroAction.description}

REFLECTION PROMPT:
"${data.reflectionPrompt}"

Open your coaching workspace: ${data.appUrl}/app
  `.trim();
}
