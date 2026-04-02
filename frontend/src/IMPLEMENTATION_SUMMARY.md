# Smart Notifications & Reminders - Implementation Summary

## What Was Built

A complete notification and reminder system for VitaPlate that sends intelligent, timezone-aware reminders to keep users engaged with meal logging, streaks, meal plans, and health goals.

## Files Created

### Entities (2)
- **`entities/Notification.json`** - Stores all in-app notifications
- **`entities/NotificationSettings.json`** - User preferences for notification types, timing, and timezone

### Components (1)
- **`components/notifications/NotificationSettingsPanel.jsx`** - Settings panel in Profile for users to customize notifications

### Backend Functions (5)
- **`functions/sendMealReminder.js`** - Sends breakfast/lunch/dinner reminders
- **`functions/sendStreakAlert.js`** - Alerts when streaks are at risk
- **`functions/sendWeeklyReminders.js`** - Weekly plan, digest, and goal check-in reminders
- **`functions/sendLabReminder.js`** - Reminds users to upload lab results
- **`functions/sendUserNotifications.js`** - Batch processor for sending to all users

### Pages Modified (1)
- **`pages/Profile.jsx`** - Added Notifications tab with NotificationSettingsPanel

### Components Enhanced (1)
- **`components/notifications/NotificationBell.jsx`** - Updated to work with new Notification schema

## Scheduled Automations Created (6)

| Name | Frequency | Time | Purpose |
|------|-----------|------|---------|
| Breakfast Meal Reminder | Daily | 9:30 AM | Log breakfast |
| Lunch Meal Reminder | Daily | 2:00 PM | Log lunch |
| Dinner Meal Reminder | Daily | 8:00 PM | Log dinner |
| Streak Risk Alert | Daily | 9:00 PM | Protect 3+ day streaks |
| Weekly Plan Reminder | Weekly | Sunday 7 PM | Prep for next week |
| Lab Result Reminder | Monthly | 1st at 10 AM | Encourage health tracking |

## Key Features

### 🎯 Smart Reminders
- Meal logging reminders (breakfast, lunch, dinner)
- Streak protection alerts (only if 3+ days at risk)
- Weekly plan reminders (Sunday evening)
- Lab result reminders (90+ days old)
- Weekly health digest (Monday)
- Goal check-in nudges

### 🌍 Timezone Awareness
- Support for major timezones (US, Europe, Asia, Australia)
- All reminder times respect user's timezone
- Stored in user's NotificationSettings

### 🤫 Quiet Hours
- Default: 10 PM - 7 AM (no notifications)
- User can enable/disable via settings
- Prevents late-night disruptions

### 🔔 In-App Notification Center
- Bell icon with unread count badge
- Notification popover with all messages
- Click to mark as read and navigate
- Mark all as read option
- Auto-refresh every 30 seconds

### ⚙️ User Control
- Full notification settings panel in Profile
- Enable/disable any notification type
- Customize reminder times (HH:MM format)
- Set timezone
- Control quiet hours

## How It Works

### User Journey
1. User goes to Profile → Notifications tab
2. Sees notification settings for each type
3. Customizes times, timezone, and quiet hours
4. Settings are saved to database

### Notification Flow
1. Scheduled automation runs at specified time
2. Backend function checks user's NotificationSettings
3. Function verifies conditions (e.g., meal not logged, streak > 3 days)
4. If all conditions met, creates notification in database
5. User sees notification in bell icon
6. Clicking notification marks it as read and navigates

### Condition Examples
- **Meal Reminder**: Only if no meals logged for that type today + reminders enabled
- **Streak Alert**: Only if streak > 3 days + no meals logged today + alerts enabled
- **Lab Reminder**: Only if 90+ days since last upload OR no previous upload
- **Quiet Hours**: All reminders check if current time is in quiet hours (e.g., 22:00-07:00)

## Settings Structure

Each user has one NotificationSettings record with:
```javascript
{
  meal_reminders: true,
  breakfast_reminder_time: "09:30",
  lunch_reminder_time: "14:00",
  dinner_reminder_time: "20:00",
  
  weekly_plan_reminder: true,
  weekly_digest: true,
  goal_checkin: true,
  
  streak_alerts: true,
  streak_alert_time: "21:00",
  
  supplement_reminders: false,
  lab_reminders: true,
  
  quiet_hours_enabled: true,
  timezone: "America/Chicago"
}
```

## Integration Points

### 1. **Profile Page**
- New Notifications tab appears in settings
- Users customize all notification preferences
- Settings auto-save on button click

### 2. **Navigation Bell Icon**
- Shows unread notification count
- Opens popover with all notifications
- Notifications link to relevant pages

### 3. **Scheduled Tasks**
- 6 automated runs per day/week/month
- Each runs in UTC at calculated times
- Processes all active users

### 4. **Database**
- Notification records persist
- Settings per user
- History available for review

## Testing Recommendations

### Test Cases
1. **Settings Page**
   - Toggle each notification type on/off
   - Change reminder times
   - Change timezone
   - Save and reload - settings persist

2. **Notifications**
   - Create test notification manually
   - Verify appears in bell icon
   - Click to mark as read
   - Click to navigate to page

3. **Automations**
   - Manually trigger via function test
   - Verify notification created
   - Check conditions work (don't send if meal already logged)
   - Verify quiet hours block notifications

4. **Edge Cases**
   - Very long notifications (should truncate)
   - No notifications (should show empty state)
   - Unread count > 9 (shows "9+")
   - Rapid mark-all-read clicks (no race conditions)

## Data Schema

### Notification Record
```javascript
{
  user_email: "user@example.com",
  type: "meal_reminder",
  title: "🥞 Time to log breakfast!",
  message: "Don't forget your breakfast...",
  action_url: "/NutritionTracking",
  is_read: false,
  read_at: null,
  notification_time: "2026-03-29T14:30:00.000Z"
}
```

### NotificationSettings Record
```javascript
{
  created_by: "user@example.com",
  meal_reminders: true,
  breakfast_reminder_time: "09:30",
  lunch_reminder_time: "14:00",
  dinner_reminder_time: "20:00",
  streak_alerts: true,
  streak_alert_time: "21:00",
  weekly_plan_reminder: true,
  weekly_digest: true,
  goal_checkin: true,
  supplement_reminders: false,
  lab_reminders: true,
  quiet_hours_enabled: true,
  timezone: "America/Chicago"
}
```

## Performance Considerations

- Notifications refetch every 30 seconds (configurable)
- Automations run once daily/weekly (minimal database load)
- Each automation processes all users in a loop
- Condition checks are fast (simple date/boolean comparisons)
- Quiet hours prevent off-hours notification spam

## Future Enhancements

- Push notifications (web/mobile)
- SMS alerts for streak milestones
- Email digests in addition to in-app
- Streaks recovery shields ("You have 1 shield left!")
- Smart timing based on user activity patterns
- Notification templates customization
- "Don't bother me this week" mode
- Celebration notifications for milestones

## Support & Troubleshooting

See `NOTIFICATION_SYSTEM.md` for:
- Detailed component documentation
- API reference for functions
- Timezone support details
- Troubleshooting guide
- Code examples