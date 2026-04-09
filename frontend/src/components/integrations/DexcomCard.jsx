import React from 'react';
import { ComingSoonCard } from './IntegrationCard';

export default function DexcomCard() {
  return (
    <ComingSoonCard
      logo="📡"
      name="Dexcom CGM"
      description="Real-time glucose data directly informs your meal recommendations"
      benefits={[
        'See your glucose response to each meal in real time',
        'Identify which foods spike your blood sugar',
        'AI adjusts meal plan based on your glucose patterns',
        'Critical for diabetics — no other app does this',
      ]}
      launchDate="Q4 2026 — Priority integration"
    />
  );
}
