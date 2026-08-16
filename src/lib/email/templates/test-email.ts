/**
 * @fileoverview Test Email HTML & Text Template.
 * Dispatched to confirm provider connectivity.
 */

export interface TestEmailData {
  userName: string;
  provider: string;
  timestamp?: string;
}

export function renderTestEmailHtml(data: TestEmailData): string {
  const time = data.timestamp || new Date().toUTCString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elevra - Email Integration Verified</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #e8e8e8; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 560px; margin: 0 auto; background-color: #161616; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
    .header { padding: 24px; border-bottom: 1px solid #2a2a2a; background-color: #1c1c1c; }
    .logo { font-size: 16px; font-weight: 700; color: #e8e8e8; letter-spacing: 0.5px; }
    .logo-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #e07856; margin-right: 6px; }
    .content { padding: 28px 24px; }
    .title { font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 12px 0; }
    .badge { display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 8px; border-radius: 4px; background-color: rgba(62, 207, 94, 0.15); color: #3ecf5e; border: 1px solid rgba(62, 207, 94, 0.3); margin-bottom: 16px; }
    .card { background-color: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .meta-row { display: flex; justify-content: space-between; font-size: 12.5px; color: #8a8a8a; margin-bottom: 6px; }
    .meta-value { color: #e8e8e8; font-weight: 500; }
    .footer { padding: 20px 24px; border-top: 1px solid #2a2a2a; font-size: 11.5px; color: #5c5c5c; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="logo-dot"></span>Elevra • AI Confidence Coach</div>
    </div>
    <div class="content">
      <div class="badge">Connection Verified</div>
      <h1 class="title">Email Integration Test Successful</h1>
      <p style="font-size: 14px; color: #8a8a8a; margin-bottom: 16px;">
        Hello ${data.userName},
      </p>
      <p style="font-size: 13.5px; color: #e8e8e8;">
        Your email delivery integration for <strong>Elevra</strong> is functioning properly. You will receive your automated weekly executive coaching digests at this address.
      </p>

      <div class="card">
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <tr>
            <td style="padding: 4px 0; color: #8a8a8a;">Delivery Provider:</td>
            <td style="padding: 4px 0; color: #e8e8e8; font-weight: 600; text-align: right; text-transform: uppercase;">${data.provider.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #8a8a8a;">Status:</td>
            <td style="padding: 4px 0; color: #3ecf5e; font-weight: 600; text-align: right;">Authenticated &amp; Active</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #8a8a8a;">Dispatched At:</td>
            <td style="padding: 4px 0; color: #e8e8e8; text-align: right;">${time}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12.5px; color: #8a8a8a; margin: 0;">
        No further action is required. You can manage your delivery preferences or switch providers anytime from your settings.
      </p>
    </div>
    <div class="footer">
      Elevra • Confidential Executive &amp; Cognitive Behavioral Coaching
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function renderTestEmailText(data: TestEmailData): string {
  const time = data.timestamp || new Date().toUTCString();
  return `
ELEVRA • AI CONFIDENCE COACH
Email Integration Test Successful

Hello ${data.userName},

Your email delivery integration for Elevra is functioning properly. You will receive your weekly executive coaching digests at this address.

Delivery Provider: ${data.provider.toUpperCase()}
Status: Authenticated & Active
Dispatched At: ${time}

No further action is required. You can manage your preferences at your Elevra settings.
  `.trim();
}
