import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'VitaPlate <support@vitaplate.ai>';
const APP_URL = process.env.FRONTEND_URL || 'https://www.vitaplate.ai';

// ─── Base HTML wrapper ────────────────────────────────────────────────────────
function baseTemplate({ preheader, body, cta, ctaUrl, ctaLabel }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VitaPlate</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f8fafc;">${preheader}</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Logo header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <span style="font-size:24px;">🥗</span>
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">VitaPlate</span>
          </div>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;">AI-Powered Biomarker Nutrition</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:40px 40px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
          ${body}
        </td></tr>

        <!-- CTA button -->
        ${cta ? `
        <tr><td style="background:#fff;padding:0 40px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;text-align:center;">
          <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
            ${ctaLabel} →
          </a>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            You're receiving this because you signed up for VitaPlate.<br/>
            <a href="${APP_URL}/Settings" style="color:#6366f1;text-decoration:none;">Manage email preferences</a>
            &nbsp;·&nbsp;
            <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">Open VitaPlate</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.2;">${text}</h1>`;
}
function p(text, style = '') {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;${style}">${text}</p>`;
}
function highlight(text) {
  return `<div style="background:#eef2ff;border-left:4px solid #4f46e5;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">${text}</div>`;
}
function badge(text, color = '#4f46e5') {
  return `<span style="display:inline-block;background:${color}20;color:${color};font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;margin:2px;">${text}</span>`;
}
function statCard(value, label, color = '#4f46e5') {
  return `<td style="text-align:center;padding:16px;background:${color}10;border-radius:12px;margin:4px;">
    <div style="font-size:28px;font-weight:800;color:${color};">${value}</div>
    <div style="font-size:12px;color:#64748b;margin-top:4px;">${label}</div>
  </td>`;
}

// ─── 1. Welcome Email ─────────────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name }) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = name?.split(' ')[0] || 'there';

  const body = `
    ${h1(`Welcome to VitaPlate, ${firstName}! 🎉`)}
    ${p("You've just joined the only nutrition platform that turns your actual lab results into a personalized meal plan. Here's how to get started in the next 5 minutes:")}
    <ol style="color:#334155;font-size:15px;line-height:2;padding-left:20px;margin:0 0 20px;">
      <li><strong>Upload your lab results</strong> — drag and drop any blood panel PDF</li>
      <li><strong>Complete your health profile</strong> — conditions, goals, dietary preferences</li>
      <li><strong>Generate your first meal plan</strong> — AI builds it around your biomarkers</li>
    </ol>
    ${highlight(`${p('<strong>💡 Pro tip:</strong> Your meal plan is most powerful when it knows your actual biomarkers. Even a single lab result (LDL, Glucose, Vitamin D) makes a significant difference in personalization.', 'margin:0;')}`)}
    ${p("Nova, your AI nutrition coach, is ready to answer any questions about your labs or meal plan.")}
  `;

  return resend.emails.send({
    from:    FROM,
    to,
    subject: `Welcome to VitaPlate, ${firstName} — let's build your first meal plan`,
    html:    baseTemplate({
      preheader: 'Your AI-powered nutrition journey starts now. Upload your first lab result.',
      body,
      cta:      true,
      ctaUrl:   `${APP_URL}/Onboarding`,
      ctaLabel: 'Complete Your Health Profile',
    }),
  });
}

// ─── 2. Meal Plan Ready Email ─────────────────────────────────────────────────
export async function sendMealPlanReadyEmail({ to, name, planName, biomarkerCount, abnormalCount, dietType }) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = name?.split(' ')[0] || 'there';

  const body = `
    ${h1(`Your meal plan is ready, ${firstName}! 🥗`)}
    ${p(`<strong>${planName || 'Your personalized meal plan'}</strong> has been generated and is waiting for you.`)}
    ${biomarkerCount > 0 ? highlight(`
      ${p(`<strong>🔬 Personalized from ${biomarkerCount} biomarkers</strong>`, 'margin:0 0 8px;')}
      ${abnormalCount > 0
        ? p(`Your plan specifically addresses your <strong>${abnormalCount} out-of-range marker${abnormalCount > 1 ? 's' : ''}</strong> — every meal was chosen to help bring those values toward optimal range.`, 'margin:0;')
        : p('All your markers are in range — your plan is optimized to keep them there.', 'margin:0;')
      }
    `) : ''}
    ${p(`Your 7-day plan includes:`)}
    <ul style="color:#334155;font-size:15px;line-height:2;padding-left:20px;margin:0 0 20px;">
      <li>Breakfast, lunch, dinner, and snacks for every day</li>
      <li>Prep times, difficulty levels, and step-by-step instructions</li>
      <li>A complete grocery list with estimated costs</li>
      <li>The specific health benefit of each meal for your biomarkers</li>
    </ul>
    ${dietType ? p(`Diet type: ${badge(dietType)}`) : ''}
  `;

  return resend.emails.send({
    from:    FROM,
    to,
    subject: `🥗 Your personalized meal plan is ready — ${planName || '7-day plan'}`,
    html:    baseTemplate({
      preheader: `${biomarkerCount || 0} biomarkers analyzed. Your AI meal plan is ready to view.`,
      body,
      cta:      true,
      ctaUrl:   `${APP_URL}/MealPlans`,
      ctaLabel: 'View Your Meal Plan',
    }),
  });
}

// ─── 3. Lab Upload Confirmation ───────────────────────────────────────────────
export async function sendLabUploadConfirmation({ to, name, biomarkerCount, abnormalCount, labDate, labProvider }) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = name?.split(' ')[0] || 'there';

  const body = `
    ${h1(`Lab results processed, ${firstName}! 🔬`)}
    ${p(`Your lab report ${labProvider ? `from <strong>${labProvider}</strong>` : ''} has been analyzed and ${biomarkerCount} biomarkers have been extracted and saved to your health profile.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:separate;border-spacing:8px;">
      <tr>
        ${statCard(biomarkerCount, 'Markers Extracted', '#4f46e5')}
        ${statCard(abnormalCount, 'Need Attention', abnormalCount > 0 ? '#ef4444' : '#10b981')}
        ${statCard(labDate || 'Today', 'Lab Date', '#0ea5e9')}
      </tr>
    </table>
    ${abnormalCount > 0
      ? highlight(`${p(`<strong>⚠️ ${abnormalCount} marker${abnormalCount > 1 ? 's are' : ' is'} outside optimal range.</strong> Generate a personalized meal plan to get specific food recommendations that address these values.`, 'margin:0;')}`)
      : highlight(`${p('<strong>✅ Great news!</strong> Your markers look healthy. Generate a meal plan to keep them optimized.', 'margin:0;')}`)}
    ${p('Your supplement recommendations have also been updated based on your new lab values.')}
  `;

  return resend.emails.send({
    from:    FROM,
    to,
    subject: `🔬 ${biomarkerCount} biomarkers extracted from your lab report`,
    html:    baseTemplate({
      preheader: `${abnormalCount > 0 ? `${abnormalCount} markers need attention.` : 'All markers look healthy.'} Generate a personalized meal plan now.`,
      body,
      cta:      true,
      ctaUrl:   `${APP_URL}/LabResults`,
      ctaLabel: 'View Your Biomarkers',
    }),
  });
}

// ─── 4. Weekly Health Digest ──────────────────────────────────────────────────
export async function sendWeeklyDigest({ to, name, streakDays, plansGenerated, checkIns, topAlert, mealPlanName }) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = name?.split(' ')[0] || 'there';
  const weekLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const body = `
    ${h1(`Your Weekly Health Digest 📊`)}
    ${p(`Here's how your week of <strong>${weekLabel}</strong> looked, ${firstName}:`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:separate;border-spacing:8px;">
      <tr>
        ${statCard(`${streakDays || 0}🔥`, 'Day Streak', '#f59e0b')}
        ${statCard(checkIns || 0, 'Check-ins', '#10b981')}
        ${statCard(plansGenerated || 0, 'Plans Generated', '#4f46e5')}
      </tr>
    </table>

    ${mealPlanName ? highlight(`${p(`<strong>Active plan:</strong> ${mealPlanName}`, 'margin:0 0 4px;')}${p('Keep following your biomarker-optimized plan for best results.', 'margin:0;')}`) : ''}

    ${topAlert ? `
    ${p('<strong>🚨 Health Insight This Week:</strong>')}
    ${highlight(p(topAlert, 'margin:0;'))}
    ` : p('No health alerts this week — keep up the great work! 🎉')}

    ${p("This week's nudge:")}
    ${highlight(p(`<em>"Consistency beats perfection. Logging even one meal per day gives VitaPlate enough data to generate better, more accurate recommendations for you."</em>`, 'margin:0;color:#475569;'))}
  `;

  return resend.emails.send({
    from:    FROM,
    to,
    subject: `📊 Your VitaPlate Weekly Digest — ${streakDays || 0} day streak!`,
    html:    baseTemplate({
      preheader: `${streakDays || 0}-day streak · ${checkIns || 0} check-ins this week · See your health summary`,
      body,
      cta:      true,
      ctaUrl:   `${APP_URL}/Dashboard`,
      ctaLabel: 'View Full Dashboard',
    }),
  });
}

// ─── 5. Streak Reminder ───────────────────────────────────────────────────────
export async function sendStreakReminderEmail({ to, name, currentStreak }) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = name?.split(' ')[0] || 'there';
  const isAboutToLose = currentStreak > 0;

  const body = isAboutToLose ? `
    ${h1(`Don't break your ${currentStreak}-day streak! 🔥`)}
    ${p(`${firstName}, you haven't checked in today yet. Your ${currentStreak}-day streak is at risk — a quick 30-second check-in keeps it alive.`)}
    ${highlight(p(`<strong>Streak protect tip:</strong> Even a simple mood + energy check-in counts. You don't need to log a full meal to keep your streak going.`, 'margin:0;'))}
    ${p("Your streak represents consistency — the single most important factor in long-term health improvement.")}
  ` : `
    ${h1(`Time to check in, ${firstName}! ✅`)}
    ${p("You haven't logged a check-in today. Take 30 seconds — how are you feeling? Any meals to log?")}
    ${p("Regular check-ins help VitaPlate learn your patterns and improve your meal recommendations over time.")}
  `;

  return resend.emails.send({
    from:    FROM,
    to,
    subject: isAboutToLose
      ? `⚠️ Your ${currentStreak}-day streak ends tonight — check in now`
      : `⏰ Quick check-in reminder — it only takes 30 seconds`,
    html: baseTemplate({
      preheader: isAboutToLose
        ? `${currentStreak} days of consistency. Don't let it slip away.`
        : 'How are you feeling today? Log a check-in.',
      body,
      cta:      true,
      ctaUrl:   `${APP_URL}/Dashboard`,
      ctaLabel: 'Check In Now',
    }),
  });
}

// ─── 6. Health Alert Notification ────────────────────────────────────────────
export async function sendHealthAlertEmail({ to, name, alerts }) {
  if (!process.env.RESEND_API_KEY || !alerts?.length) return;
  const firstName = name?.split(' ')[0] || 'there';

  const alertsHtml = alerts.slice(0, 3).map(alert => `
    <div style="border:1px solid ${alert.severity === 'urgent' ? '#fca5a5' : '#fde68a'};border-radius:10px;padding:16px;margin-bottom:12px;background:${alert.severity === 'urgent' ? '#fff5f5' : '#fffbeb'};">
      <p style="margin:0 0 6px;font-weight:600;color:#0f172a;font-size:14px;">${alert.message}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#475569;">${alert.recommendedAction || ''}</p>
      ${alert.suggestedFoods?.length ? `<p style="margin:0;font-size:12px;color:#64748b;">Try: <strong>${alert.suggestedFoods.slice(0,3).join(', ')}</strong></p>` : ''}
    </div>
  `).join('');

  const body = `
    ${h1(`Health insights for you, ${firstName} 🏥`)}
    ${p("Based on your nutrition patterns and lab results, VitaPlate has detected the following:")}
    ${alertsHtml}
    ${p("Your meal plan can be updated to address these patterns. Review your alerts and adjust your plan in the app.", 'color:#64748b;font-size:13px;')}
  `;

  return resend.emails.send({
    from:    FROM,
    to,
    subject: `🏥 ${alerts.length} personalized health insight${alerts.length > 1 ? 's' : ''} from VitaPlate`,
    html:    baseTemplate({
      preheader: alerts[0]?.message || 'VitaPlate has detected patterns in your nutrition data.',
      body,
      cta:      true,
      ctaUrl:   `${APP_URL}/HealthAlerts`,
      ctaLabel: 'Review Health Alerts',
    }),
  });
}

// ─── Safe wrapper — never let email failures crash the app ────────────────────
export async function safeEmail(fn) {
  try {
    await fn();
  } catch (err) {
    console.error('Email send failed (non-fatal):', err.message);
  }
}
