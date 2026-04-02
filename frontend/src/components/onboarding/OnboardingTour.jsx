import React, { useState, useEffect, useRef } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function OnboardingTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const tourStarted = useRef(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (!user || tourStarted.current) return;
    const hasSeenTour = localStorage.getItem('vitaplate_tour_completed');
    if (!hasSeenTour) {
      tourStarted.current = true;
      setTimeout(() => setRun(true), 1000);
    } else {
      tourStarted.current = true; // prevent future checks
    }
  }, [user]);

  const steps = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">Welcome to VitaPlate! 🎉</h2>
          <p>Let's take a quick tour of your personalized nutrition platform. This will only take a minute!</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[href*="Dashboard"]',
      content: 'Your Dashboard shows your nutrition stats, recent activity, and quick actions at a glance.',
    },
    {
      target: '[href*="HealthDietHub"]',
      content: 'Generate personalized meal plans based on your health goals, dietary restrictions, and preferences.',
    },
    {
      target: '[href*="AIRecipeGenerator"]',
      content: 'Create custom recipes instantly using AI - just enter your available ingredients or preferences!',
    },
    {
      target: '[href*="MealPlans"]',
      content: 'View and manage all your saved meal plans here. You can edit, share, or create new plans.',
    },
    {
      target: '[href*="Profile"]',
      content: 'Set your preferences here - health goals, allergens, cooking skills, and budget. This personalizes everything!',
    },
    {
      target: '[href*="Community"]',
      content: 'Connect with others, share recipes, and get inspired by the community.',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">You're all set! 🚀</h2>
          <p>Start by setting your profile preferences, then generate your first meal plan. Enjoy your journey to better health!</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('vitaplate_tour_completed', 'true');
    }
  };

  const restartTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  // Expose restart function globally so it can be called from Help Center
  useEffect(() => {
    window.restartVitaPlateTour = restartTour;
    return () => {
      delete window.restartVitaPlateTour;
    };
  }, []);

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4f46e5',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          fontSize: '14px',
        },
        buttonNext: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '14px',
        },
        buttonBack: {
          color: '#64748b',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#64748b',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}