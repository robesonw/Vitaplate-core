import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function GoogleCalendarCard() {
  return (
    <ComingSoonCard
      logo="📅"
      name="Google Calendar"
      description="Sync your meal plan directly to your calendar"
      benefits={[
        'Meals appear as calendar events with prep time',
        'Grocery day reminders auto-scheduled',
        'Meal prep blocks added to your week',
      ]}
      launchDate="Q2 2026"
    />
  );
}
