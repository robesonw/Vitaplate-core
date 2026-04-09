import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function WHOOPCard() {
  return (
    <ComingSoonCard
      logo="⚡"
      name="WHOOP"
      description="Link strain and recovery metrics to your nutrition plan"
      benefits={[
        'Strain score drives protein and carb recommendations',
        'Recovery percentage adjusts meal complexity',
        'Sleep performance linked to energy goals',
      ]}
      launchDate="Q3 2026"
    />
  );
}
