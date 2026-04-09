import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function GarminCard() {
  return (
    <ComingSoonCard
      logo="🔵"
      name="Garmin"
      description="Sync training load and recovery data from Garmin devices"
      benefits={[
        'Training load informs protein and carb targets',
        'Recovery scores adjust meal plan intensity',
        'VO2 Max linked to endurance nutrition plans',
      ]}
      launchDate="Q3 2026"
    />
  );
}
