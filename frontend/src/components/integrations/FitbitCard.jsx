import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function FitbitCard() {
  return (
    <ComingSoonCard
      logo="⌚"
      name="Fitbit"
      description="Sync activity, sleep, and heart rate from your Fitbit"
      benefits={[
        'Sleep score linked to morning meal recommendations',
        'Heart rate zones inform nutrition targets',
        'Daily steps auto-adjust calorie goals',
      ]}
      launchDate="Q3 2026"
    />
  );
}
