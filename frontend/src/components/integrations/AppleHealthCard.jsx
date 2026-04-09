import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function AppleHealthCard() {
  return (
    <ComingSoonCard
      logo="🍎"
      name="Apple Health"
      description="Sync steps, sleep, heart rate and nutrition from Apple Health"
      benefits={[
        'Auto-adjust meal plan calories based on activity',
        'Sleep quality linked to recovery meal recs',
        'Heart rate zones inform nutrition targets',
        'Import lab results via Apple Health FHIR',
      ]}
      launchDate="Q2 2026"
    />
  );
}
