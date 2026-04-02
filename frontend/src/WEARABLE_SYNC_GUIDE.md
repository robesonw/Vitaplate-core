# Apple Health & Google Fit Integration Guide

## Overview
VitaPlate now syncs daily activity data from native phone health platforms to automatically adjust meal recommendations and track fitness metrics.

## Features

### 🔄 Automatic Data Sync
- **Daily Steps** - Activity level tracking
- **Active Calories** - Calories burned during exercise
- **Resting Heart Rate** - Cardiovascular health indicator
- **Sleep Duration** - Sleep quality and duration
- **Body Weight** - Automatic weight logging
- **Heart Rate Variability** (Apple Health only)

### 🎯 Dynamic Calorie Adjustment
Meal targets automatically adjust based on daily activity:
- **Sedentary** (<5,000 steps): No change
- **Lightly Active** (5,000-7,500 steps): +150 calories
- **Active** (7,500-10,000 steps): +250 calories
- **Very Active** (10,000-15,000 steps): +400 calories
- **Extremely Active** (15,000+ steps): +600 calories

### 📊 Dashboard Stats
Today's Activity card shows:
- Step count with activity level badge
- Calories burned
- Sleep hours
- Resting heart rate
- Last sync time

### ⚠️ Outdated Data Warnings
- Yellow warning banner appears if data is >24 hours old
- "Sync Now" button lets users manually trigger refresh
- Automations ensure data stays current

## Setup Instructions

### Apple Health (iOS)

#### For Users
1. Go to **Settings** → **Integrations** → **Apple Health**
2. Tap **Connect** button
3. Grant access to health data:
   - Steps
   - Active calories
   - Resting heart rate
   - Sleep
   - Weight
4. Data syncs automatically from Health app

#### Developer Notes
- Web app cannot directly access HealthKit API
- Users must enable data sharing through Health app
- Manual "Sync Now" opens Health app to guide the process
- Data comes via webhook or manual user submission

### Google Fit (Android)

#### For Users
1. Go to **Settings** → **Integrations** → **Google Fit**
2. Tap **Connect** button
3. Sign in with Google account
4. Grant access to:
   - Activity data
   - Sleep data
   - Heart rate data
   - Weight data
5. Data syncs automatically daily

#### Developer Notes
- Uses Google Fit REST API v1
- OAuth 2.0 authentication flow
- Scopes: `fitness.activity.read`, `fitness.sleep.read`, `fitness.body.read`, `fitness.heart_rate.read`
- Pulls daily aggregated data
- Syncs happen in background

## Backend Functions

### `syncAppleHealth.js`
**Purpose**: Accept and store Apple Health data submitted by user
**Triggered By**: Manual user submission via Health app
**Input**: 
```javascript
{
  steps: number,
  activeCalories: number,
  restingCalories: number,
  sleepHours: number,
  restingHeartRate: number,
  bodyWeight: number,
  syncDate: "2026-03-29"
}
```
**Output**: Stores WearableSync record

### `syncGoogleFit.js`
**Purpose**: Fetch daily data from Google Fit API
**Triggered By**: User clicks "Sync Now" or scheduled automation
**Input**: `{ accessToken: string }`
**Output**: Parses Google Fit aggregated data and stores WearableSync record
**API Calls**:
- POST `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`
- Requests: steps, calories, heart rate, weight, sleep

### `calculateAdjustedCalories.js`
**Purpose**: Calculate calorie adjustment based on steps
**Input**: 
```javascript
{
  steps: number,
  baseDailyCalories: number (default 2000)
}
```
**Output**: 
```javascript
{
  adjustment: number,
  activityLevel: "sedentary" | "lightly_active" | "active" | "very_active" | "extremely_active",
  reason: "You took X steps...",
  adjustedCalories: number
}
```

## Database Schema

### WearableSync Entity
Stores all synced activity data by date:

```javascript
{
  sync_date: "2026-03-29",          // Date of activity
  source: "apple_health|google_fit|manual",
  steps: 8432,
  active_calories: 380,
  resting_calories: 1620,
  sleep_hours: 7.5,
  sleep_quality: "good|poor|fair|excellent",
  resting_heart_rate: 62,
  body_weight: 75.5,                // kg
  body_fat_percentage: 18.5,        // optional
  notes: "Had a long run today",
  synced_at: "2026-03-29T14:23:00Z"
}
```

### ReminderLog Entity
Tracks sync activity for auditing:

```javascript
{
  user_email: "user@example.com",
  reminder_type: "activity_sync",
  reminder_date: "2026-03-29",
  was_sent: true,
  sent_at: "2026-03-29T14:23:00Z"
}
```

## Implementation Flow

### Daily Sync Flow
1. **Google Fit users**: Automated daily sync via cron job (or manual "Sync Now")
2. **Apple Health users**: Manual "Sync Now" or automatic via Health app sharing
3. Function fetches data and creates WearableSync record
4. Dashboard displays last 24h stats
5. Meal plan calorie targets auto-adjust based on activity

### Calorie Adjustment Flow
1. New WearableSync record created with steps data
2. Backend checks user's current meal plan
3. Calls `calculateAdjustedCalories` with step count
4. Updates meal plan's daily calorie target
5. Displays adjustment reason: "You burned 380 extra calories..."

## Frontend Components

### AppleHealthCard
- Location: `components/integrations/AppleHealthCard.jsx`
- Shows: Connection status, last sync time, today's stats
- Actions: Connect, Sync Now, Disconnect
- Features: Last 24h warning, iOS-only visibility

### GoogleFitCard
- Location: `components/integrations/GoogleFitCard.jsx`
- Shows: Connection status, last sync time, today's stats
- Actions: OAuth connect flow, Sync Now, Disconnect
- Features: Last 24h warning, Android-only visibility

### ActivitySummaryCard
- Location: `components/dashboard/ActivitySummaryCard.jsx`
- Shows: Steps, active calories, sleep, heart rate
- Features: Activity level badge, color coding, last sync time
- Refreshes: Every 60 seconds

### Integrations Page
- Location: `pages/Integrations.jsx`
- Shows: Both platform cards side-by-side
- Includes: How it works, calorie adjustment logic
- Coming soon section

## API Setup (Google Fit)

### Required Credentials
1. Google OAuth app (create at https://console.cloud.google.com)
2. Client ID and Client Secret
3. Redirect URI: `{app_url}/oauth/callback/google-fit`

### OAuth Scopes
```
https://www.googleapis.com/auth/fitness.activity.read
https://www.googleapis.com/auth/fitness.sleep.read
https://www.googleapis.com/auth/fitness.body.read
https://www.googleapis.com/auth/fitness.heart_rate.read
```

### Access Token
- Valid for ~1 hour
- Refresh token used to get new access token
- Store securely (encrypted)

## Troubleshooting

### Apple Health - No data syncing
1. User must go to Health app > Profile > Data Access & Devices
2. Select VitaPlate and toggle on permission for each data type
3. Health app should prompt to share data with VitaPlate

### Google Fit - Authorization fails
1. Check OAuth credentials are correct
2. Verify redirect URI matches exactly
3. Check user has granted all 4 scopes
4. Try disconnecting and reconnecting

### Data appears outdated
1. Click "Sync Now" button to manually trigger refresh
2. Check last sync timestamp
3. Verify device has recent data (check Health/Fit app directly)

### Weight not syncing
1. Apple: User must log weight in Health app
2. Google Fit: User must log weight in Fit app or device
3. Data syncs on next scheduled sync or manual trigger

### Wrong activity level badge
1. Steps count should be accurate from device
2. Check calculation ranges (5K, 7.5K, 10K, 15K)
3. Verify sync happened today (not yesterday's data)

## Future Enhancements
- Oura Ring integration
- WHOOP Band integration
- Fitbit integration
- Continuous glucose monitors (CGM)
- Real-time vs. end-of-day sync options
- Manual data entry fallback
- Workout type detection (running vs. walking)
- Auto-logging recovery meals based on activity

## Privacy & Security
- Health data encrypted in transit (HTTPS)
- OAuth tokens stored securely
- Users can disconnect and delete any time
- No third-party data sharing
- HIPAA-compliant storage (coming soon)

## Testing

### Test Apple Health
1. Use iOS simulator or device with Health app
2. Manually add test data to Health app
3. Click "Sync Now" in VitaPlate
4. Verify data appears in Dashboard

### Test Google Fit
1. Use Android device or emulator
2. Add test data to Google Fit app
3. Trigger sync via cron or manual button
4. Check Dashboard for updated stats

### Test Calorie Adjustment
1. Add WearableSync record with steps
2. Verify meal plan calorie target updates
3. Check adjustment reason message displays
4. Test all 5 activity level thresholds