import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function GoogleFitCard() {
  return (
    <ComingSoonCard
      logo="🏃"
      name="Google Fit"
      description="Sync activity data from Google Fit and Android Health"
      benefits={[
        'Steps and calories auto-synced daily',
        'Active minutes adjust your calorie targets',
        'Workout sessions logged automatically',
      ]}
      launchDate="Q2 2026"
    />
  );
}
