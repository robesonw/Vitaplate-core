import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function OuraRingCard() {
  return (
    <ComingSoonCard
      logo="💍"
      name="Oura Ring"
      description="Use sleep and readiness scores to optimize your nutrition"
      benefits={[
        'Readiness score adjusts meal plan difficulty',
        'HRV data linked to anti-inflammatory recs',
        'Sleep stages inform recovery nutrition',
      ]}
      launchDate="Q3 2026"
    />
  );
}
