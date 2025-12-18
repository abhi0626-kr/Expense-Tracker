import Joyride, { CallBackProps, STATUS, Step, Styles } from "react-joyride";

interface OnboardingTourProps {
  steps: Step[];
  run: boolean;
  stepIndex: number;
  onCallback: (data: CallBackProps) => void;
}

const tourStyles: Partial<Styles> = {
  options: {
    primaryColor: "hsl(var(--primary))",
    textColor: "hsl(var(--foreground))",
    backgroundColor: "hsl(var(--card))",
    overlayColor: "rgba(0, 0, 0, 0.7)",
    arrowColor: "hsl(var(--card))",
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: "8px",
    padding: "20px",
    fontSize: "14px",
  },
  tooltipContainer: {
    textAlign: "left",
  },
  tooltipTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  tooltipContent: {
    padding: "10px 0",
  },
  buttonNext: {
    backgroundColor: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
  },
  buttonBack: {
    color: "hsl(var(--muted-foreground))",
    marginRight: "10px",
    fontSize: "14px",
  },
  buttonSkip: {
    color: "hsl(var(--muted-foreground))",
    fontSize: "14px",
  },
  buttonClose: {
    color: "hsl(var(--muted-foreground))",
    fontSize: "14px",
  },
  beacon: {
    outline: "none",
  },
};

export const OnboardingTour = ({ steps, run, stepIndex, onCallback }: OnboardingTourProps) => {
  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      scrollOffset={100}
      disableScrolling={false}
      disableOverlayClose
      spotlightClicks={false}
      styles={tourStyles}
      callback={onCallback}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
};
