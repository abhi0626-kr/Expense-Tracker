import { useState } from "react";

const ONBOARDING_STORAGE_KEY = "expense-tracker-onboarding-completed";

export const useOnboarding = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
  };

  const completeTour = () => {
    setRun(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setStepIndex(0);
    setRun(true);
  };

  const skipTour = () => {
    setRun(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
  };

  return {
    run,
    stepIndex,
    setStepIndex,
    startTour,
    stopTour,
    completeTour,
    resetOnboarding,
    skipTour,
  };
};
