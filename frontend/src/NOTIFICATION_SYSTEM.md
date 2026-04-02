# VitaPlate Smart Notification & Reminder System

## Overview
A comprehensive notification system that sends timely in-app and push reminders to keep users on track with meal logging, streaks, meal plans, and health goals.

## Components

### 1. **Notification Entities**

#### `Notification`
Stores all user notifications with the following fields:
- `user_email`: Recipient's email
- `type`: meal_reminder, streak_alert, weekly_plan, supplement_reminder, lab_reminder, health_digest, goal_checkin, etc.
- `title`: Notification title (e.g., "🥞 Time to log breakfast!")
- `message`: Detailed message
- `action_url`: Link to relevant page (e.g., "/NutritionTracking")
- `is_read`: Boolean flag (default: false)
- `read_at`: Timestamp when marked as read
- `notification_time`: When notification was created

#### `NotificationSettings`
User preferences for notifications with:
- Meal reminders (breakfast, lunch, dinner) - enabled/disabled + custom times
- Weekly plan reminder (Sunday 7 PM) - enabled/disabled
- Streak alerts (when 3+ day streak at risk) - enabled/disabled + custom time
- Supplement reminders (morning) - enabled/disabled
- Lab reminders (90+ days since upload) - enabled/disabled
- Weekly digest (Monday 8 AM) - enabled/disabled
- Goal check-in (weekly) - enabled/disabled
- Quiet hours (10 PM - 7 AM) - enabled/disabled
- User's timezone (for accurate timing)

### 2. **UI Components**

#### `NotificationSettingsPanel`
Located in: `components/notifications/NotificationSettingsPanel.jsx`

Features:
- Timezone selector with support for major timezones
- Quiet hours toggle (10 PM - 7 AM default)
- Individual toggles for each notification type
- Customizable reminder times (HH:MM format)
- Persistent save with database sync

#### `NotificationBell`
Enhanced bell icon in the main navigation:
- Shows unread notification count badge
- Displays all notifications in a popover
- Mark individual notification as read
- Mark all as read button
- Click notification to navigate to relevant page
- Auto-refetch every 30 seconds
- Safe context handling (won't break if Router/QueryClient missing)

### 3. **Backend Functions**

#### `sendMealReminder.js`
Sends meal logging reminders:
- Checks if meal reminders are enabled in settings
- Verifies meal hasn't been logged today
- Respects quiet hours
- Creates notification only if conditions met
- Called via scheduled automations for each meal

#### `sendStreakAlert.js`
Sends streak-at-risk alerts:
- Checks if streak alerts are enabled
- Only alerts if current streak > 3 days
- Only if no meals logged today
- Respects quiet hours
- Creates urgency to maintain streak

#### `sendWeeklyReminders.js`
Sends weekly reminders:
- Weekly plan (Sunday 7 PM)
- Weekly digest (Monday morning - optional)
- Goal check-in (weekly)
- Each type respects user settings
- Quiet hours honored

#### `sendLabReminder.js`
Sends lab result reminders:
- Checks if 90+ days since last upload
- Or encourages first-time upload
- Runs monthly on 1st of month
- Respects quiet hours

#### `sendUserNotifications.js`
Batch processor for getting all active users and triggering reminders:
- Gets all users with meal plans
- Processes reminders in loop
- Logs success/skip/error counts

### 4. **Scheduled Automations**

| Automation | Type | Schedule | Function | Purpose |
|-----------|------|----------|----------|---------|
| Breakfast Meal Reminder | Cron | 9:30 AM (14:30 UTC) | sendMealReminder | Remind to log breakfast |
| Lunch Meal Reminder | Cron | 2:00 PM (19:00 UTC) | sendMealReminder | Remind to log lunch |
| Dinner Meal Reminder | Cron | 8:00 PM (01:00 UTC next day) | sendMealReminder | Remind to log dinner |
| Streak Risk Alert | Cron | 9:00 PM (02:00 UTC next day) | sendStreakAlert | Protect 3+ day streaks |
| Weekly Plan Reminder | Cron | Sunday 7 PM (01:00 UTC Mon) | sendWeeklyReminders | Prep for new week |
| Lab Result Reminder | Simple | Monthly on 1st at 10:00 | sendLabReminder | Encourage health tracking |

**Note:** Times shown are approximate conversions from user timezones. Automations work across all user timezones via the `NotificationSettings.timezone` field.

## Features

### ✅ Smart Timing
- All reminders respect user's timezone
- Quiet hours (10 PM - 7 AM default) prevent late-night notifications
- Customizable reminder times via settings
- Cron-based scheduling for precision

### ✅ Selective Notifications
- Each notification type can be toggled on/off
- Only sends if relevant conditions are met:
  - Meal reminders only if meal not logged
  - Streak alerts only if streak > 3 days AND no meals logged
  - Lab reminders only if 90+ days since upload
  - Plan reminders only if plan exists

### ✅ In-App Notification Center
- Persistent unread badge on bell icon
- Notification popover with all recent notifications
- Click to mark as read and navigate
- Mark all as read option
- Auto-refresh every 30 seconds

### ✅ User Control
- Settings page in Profile → Notifications tab
- Enable/disable any notification type
- Customize reminder times
- Set timezone
- Enable/disable quiet hours

## User Flow

1. **First Visit**
   - User goes to Profile → Notifications tab
   - Sees default settings (most enabled, U.S. timezone)
   - Adjusts preferences and saves

2. **Receiving Notifications**
   - At scheduled time, automation runs
   - Backend function checks user settings
   - Creates notification if conditions met
   - Notification appears in bell icon

3. **Managing Notifications**
   - User clicks bell to view all notifications
   - Can mark individual as read
   - Can mark all as read at once
   - Clicks notification to navigate and view context

## Timezone Support

Supported timezones include:
- US timezones (Chicago, New York, Los Angeles, Denver)
- European (London, Paris)
- Asian (Tokyo)
- Australian (Sydney)
- UTC

Each user's timezone is stored in `NotificationSettings.timezone` and used to calculate when automations should run.

## API Reference

### Create Notification (in backend functions)
```javascript
await base44.asServiceRole.entities.Notification.create({
  user_email: "user@example.com",
  type: "meal_reminder",
  title: "🥞 Time to log breakfast!",
  message: "Don't forget to log your breakfast...",
  action_url: "/NutritionTracking",
  notification_time: new Date().toISOString()
});
```

### Get User Settings
```javascript
const settings = await base44.asServiceRole.entities.NotificationSettings.filter({
  created_by: userEmail
});
const userSettings = settings?.[0];
```

### Check Quiet Hours
```javascript
const now = new Date();
const hour = now.getHours();
const isDuringQuietHours = hour >= 22 || hour < 7;
if (!userSettings?.quiet_hours_enabled || !isDuringQuietHours) {
  // Send notification
}
```

## Troubleshooting

### Notifications Not Appearing
1. Check if notification type is enabled in settings
2. Verify quiet hours aren't blocking them
3. Check browser console for errors
4. Verify `user_email` field is set correctly

### Reminders Firing at Wrong Time
1. Verify user timezone in NotificationSettings
2. Check if cron time is correct for that timezone
3. Verify no quiet hours are blocking

### Duplicate Notifications
1. Check automation isn't running multiple times
2. Verify database doesn't have duplicate records
3. Check function isn't being called manually + via automation

## Future Enhancements
- Push notifications (mobile/web)
- SMS reminders for critical alerts
- Custom reminder sequences
- Notification history/archive
- Smart timing based on user activity patterns
- Streak recovery ("You have 1 shield remaining!")
- Weekly streak milestone celebrations