import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import {
  sendWeeklyDigest,
  sendStreakReminderEmail,
  sendHealthAlertEmail,
  safeEmail,
} from '../services/email.js';

// ─── Weekly Health Digest — every Monday at 8am UTC ──────────────────────────
export function scheduleWeeklyDigest() {
  cron.schedule('0 8 * * 1', async () => {
    console.log('📧 Running weekly digest job...');
    let sent = 0;

    try {
      const users = await prisma.user.findMany({
        include: {
          settings:   true,
          streaks:    true,
          preferences: true,
        },
      });

      for (const user of users) {
        // Skip if user opted out
        if (user.settings?.weeklyDigest === false) continue;

        try {
          // Get this week's stats
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

          const [checkIns, plans, alerts] = await Promise.all([
            prisma.dailyCheckIn.count({
              where: { userId: user.id, createdDate: { gte: weekAgo } },
            }),
            prisma.mealPlan.count({
              where: { userId: user.id, createdDate: { gte: weekAgo } },
            }),
            prisma.healthAlert.findMany({
              where:   { userId: user.id, acknowledged: false },
              orderBy: { createdDate: 'desc' },
              take:    1,
            }),
          ]);

          const latestPlan = await prisma.mealPlan.findFirst({
            where:   { userId: user.id },
            orderBy: { createdDate: 'desc' },
            select:  { name: true },
          });

          await safeEmail(() => sendWeeklyDigest({
            to:             user.email,
            name:           user.fullName,
            streakDays:     user.streaks?.currentStreak || 0,
            plansGenerated: plans,
            checkIns,
            topAlert:       alerts[0]?.message,
            mealPlanName:   latestPlan?.name,
          }));

          sent++;
        } catch (err) {
          console.error(`Digest failed for ${user.email}:`, err.message);
        }
      }

      console.log(`✅ Weekly digest sent to ${sent} users`);
    } catch (err) {
      console.error('Weekly digest job error:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('⏰ Weekly digest scheduled: Mondays 8am UTC');
}

// ─── Streak Reminder — every day at 7pm UTC ───────────────────────────────────
export function scheduleStreakReminder() {
  cron.schedule('0 19 * * *', async () => {
    console.log('📧 Running streak reminder job...');
    let sent = 0;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Find users who haven't checked in today
      const usersWithStreaks = await prisma.userStreak.findMany({
        where: {
          currentStreak: { gt: 0 },
          lastCheckIn:   { not: today },
        },
        include: { user: { include: { settings: true } } },
      });

      for (const streak of usersWithStreaks) {
        const user = streak.user;
        if (!user?.email) continue;
        if (user.settings?.emailNotifications === false) continue;

        await safeEmail(() => sendStreakReminderEmail({
          to:            user.email,
          name:          user.fullName,
          currentStreak: streak.currentStreak,
        }));

        sent++;
      }

      console.log(`✅ Streak reminders sent to ${sent} users`);
    } catch (err) {
      console.error('Streak reminder job error:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('⏰ Streak reminders scheduled: Daily 7pm UTC');
}

// ─── Predictive Health Alerts — every day at 6am UTC ─────────────────────────
export function scheduleHealthAlerts() {
  cron.schedule('0 6 * * *', async () => {
    console.log('🏥 Running health alert detection job...');
    let processed = 0;
    let alertsCreated = 0;

    try {
      const users = await prisma.user.findMany({
        include: { preferences: true },
      });

      for (const user of users) {
        try {
          const alerts = await generateHealthAlerts(user);
          if (alerts.length === 0) { processed++; continue; }

          // Get existing unacknowledged alerts
          const existing = await prisma.healthAlert.count({
            where: { userId: user.id, acknowledged: false },
          });

          // Cap at 2 active alerts per user
          const toCreate = alerts.slice(0, Math.max(0, 2 - existing));

          for (const alert of toCreate) {
            await prisma.healthAlert.create({
              data: { userId: user.id, ...alert, acknowledged: false, emailSent: false },
            });
            alertsCreated++;
          }

          // Email if new alerts created
          if (toCreate.length > 0) {
            await safeEmail(() => sendHealthAlertEmail({
              to:     user.email,
              name:   user.fullName,
              alerts: toCreate,
            }));
          }

          processed++;
        } catch (err) {
          console.error(`Alert check failed for ${user.email}:`, err.message);
        }
      }

      console.log(`✅ Health alerts: ${processed} users processed, ${alertsCreated} alerts created`);
    } catch (err) {
      console.error('Health alert job error:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('⏰ Health alerts scheduled: Daily 6am UTC');
}

// ─── Alert generation logic (rules engine) ───────────────────────────────────
async function generateHealthAlerts(user) {
  const alerts = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get recent nutrition logs
  const logs = await prisma.nutritionLog.findMany({
    where:   { userId: user.id, createdDate: { gte: thirtyDaysAgo } },
    orderBy: { createdDate: 'desc' },
    take:    100,
  });

  if (logs.length < 5) return alerts; // Not enough data

  // Get latest lab result
  const latestLab = await prisma.labResult.findFirst({
    where:   { userId: user.id },
    orderBy: { uploadDate: 'desc' },
  });

  const biomarkers = latestLab?.biomarkers || {};
  const prefs      = user.preferences;

  // Average nutrients
  const avg = (field) => {
    const vals = logs.map(l => l[field]).filter(Boolean);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const avgFat    = avg('fat');
  const avgCarbs  = avg('carbs');
  const avgSodium = avg('sodium');
  const avgFiber  = avg('fiber');

  // Rule 1: High saturated fat + high LDL
  const ldl = biomarkers['LDL Cholesterol']?.value;
  if (avgFat > 70 && ldl >= 130) {
    alerts.push({
      alertType:         'high_fat_ldl',
      severity:          ldl >= 160 ? 'urgent' : 'warning',
      message:           `⚠️ Your fat intake has been elevated and your LDL is ${ldl} mg/dL`,
      currentMetric:     `${avgFat?.toFixed(0)}g fat/day avg (last 30 days)`,
      recommendedAction: 'Reduce saturated fats — swap red meat for fish, use olive oil instead of butter.',
      suggestedFoods:    ['salmon', 'olive oil', 'avocado', 'walnuts', 'chicken breast'],
      predictedDirection:'trending_up',
    });
  }

  // Rule 2: High carbs + prediabetic/diabetic
  const hba1c = biomarkers['HbA1c']?.value || biomarkers['Glucose']?.value;
  if (avgCarbs > 280 && (prefs?.diabetesType || hba1c >= 5.7)) {
    alerts.push({
      alertType:         'high_carbs_diabetes',
      severity:          'warning',
      message:           `⚠️ High carbohydrate intake detected with diabetes risk markers`,
      currentMetric:     `${avgCarbs?.toFixed(0)}g carbs/day avg`,
      recommendedAction: 'Target 150-200g carbs/day. Focus on fiber-rich, low-glycemic options.',
      suggestedFoods:    ['lentils', 'quinoa', 'broccoli', 'sweet potato', 'chickpeas'],
      predictedDirection:'trending_up',
    });
  }

  // Rule 3: Low fiber
  if (avgFiber !== null && avgFiber < 15) {
    alerts.push({
      alertType:         'low_fiber',
      severity:          'advisory',
      message:           `💡 Your fiber intake is below the recommended 25-35g/day`,
      currentMetric:     `${avgFiber?.toFixed(1)}g fiber/day avg`,
      recommendedAction: 'Add beans, lentils, or whole grains to one meal daily.',
      suggestedFoods:    ['oats', 'black beans', 'lentils', 'chia seeds', 'broccoli'],
      predictedDirection:'stable',
    });
  }

  // Rule 4: High sodium + hypertension
  if (avgSodium > 3000 && prefs?.heartCondition === 'hypertension') {
    alerts.push({
      alertType:         'high_sodium_hypertension',
      severity:          'warning',
      message:           `⚠️ Sodium intake is elevated for blood pressure management`,
      currentMetric:     `${avgSodium?.toFixed(0)}mg sodium/day avg`,
      recommendedAction: 'Target under 2,300mg sodium/day. Avoid processed foods and use herbs for seasoning.',
      suggestedFoods:    ['fresh herbs', 'garlic', 'lemon juice', 'unsalted nuts', 'fresh vegetables'],
      predictedDirection:'trending_up',
    });
  }

  return alerts;
}

// ─── Start all scheduled jobs ─────────────────────────────────────────────────
export function startAllJobs() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏩ Skipping cron jobs in development mode');
    return;
  }
  scheduleWeeklyDigest();
  scheduleStreakReminder();
  scheduleHealthAlerts();
  console.log('✅ All cron jobs started');
}
