# Onboarding Tour Feature

## Overview

The Expense Tracker now includes a comprehensive onboarding tour system that guides new users through all features and functionality. The tour uses interactive tooltips and pop-ups to explain each button, feature, and section of the application.

## Features

### 1. **Welcome Dialog**
- Appears automatically for first-time users
- Provides an overview of what the tour covers
- Options to start the tour or skip it
- Can be dismissed and won't appear again once completed

### 2. **Dashboard Tour** (17 Steps)
Covers all main features on the dashboard:
- Add Transaction button
- Transfer Funds button
- Advanced Features button (with budget alerts)
- Profile button
- Theme toggle
- Sign out button
- Total Balance card
- Total Income card
- Total Expenses card
- Accounts section
- Spending Trend chart
- Category Breakdown chart
- Weekly Comparison chart
- Monthly Comparison chart
- Category Distribution pie chart
- Recent Transactions list

### 3. **Features Page Tour** (7 Steps)
Guides users through advanced features:
- Back to Dashboard button
- Account Manager tab
- Budget Manager tab
- Recurring Transactions tab
- Currency Converter tab
- Export & Import tab

### 4. **Tour Controls**
- **Next**: Move to the next step
- **Back**: Return to the previous step
- **Skip Tour**: Exit the tour at any time
- **Progress Indicator**: Shows current step number
- **Finish**: Complete the tour

### 5. **Restart Tour Option**
- Available in Profile page under "Help & Settings"
- Allows users to replay the tour anytime
- Useful for refreshing knowledge or exploring new features

## Technical Implementation

### Files Created

1. **`src/hooks/useOnboarding.tsx`**
   - Custom hook for managing tour state
   - Handles localStorage persistence
   - Methods: `startTour()`, `stopTour()`, `completeTour()`, `resetOnboarding()`, `skipTour()`

2. **`src/components/OnboardingTour.tsx`**
   - Wrapper component for React Joyride
   - Configures tour styles to match app theme
   - Handles tour callbacks and navigation

3. **`src/components/WelcomeDialog.tsx`**
   - Welcome dialog for first-time users
   - Animated entrance
   - Lists tour benefits

4. **`src/utils/tourSteps.tsx`**
   - Defines all tour steps for Dashboard
   - Defines all tour steps for Features page
   - Each step includes targeting selector and helpful content

### Integration Points

1. **Dashboard Component** (`src/components/Dashboard.tsx`)
   - Added `data-tour` attributes to all interactive elements
   - Integrated OnboardingTour component
   - Integrated WelcomeDialog component

2. **Features Page** (`src/pages/Features.tsx`)
   - Added `data-tour` attributes to all tabs
   - Integrated OnboardingTour component

3. **Profile Page** (`src/pages/Profile.tsx`)
   - Added "Restart Onboarding Tour" button
   - Clears localStorage and navigates back to dashboard

## Dependencies

- **react-joyride** v2.8.2 - Core library for creating guided tours
  - Provides beacon indicators
  - Handles spotlight effects
  - Manages step navigation
  - Supports custom styling

## Usage

### For Users

1. **First Visit**: 
   - Welcome dialog appears automatically
   - Click "Start Tour" to begin
   - Or click "Skip Tour" to explore on your own

2. **During Tour**:
   - Follow the highlighted elements
   - Read the descriptions for each feature
   - Use "Next" to proceed or "Back" to review
   - Click "Skip Tour" anytime to exit

3. **Restart Tour**:
   - Go to Profile page
   - Scroll to "Help & Settings" section
   - Click "Restart Onboarding Tour"
   - You'll be redirected to dashboard where tour begins

### For Developers

#### Adding New Tour Steps

To add a new step to the dashboard tour:

```typescript
// In src/utils/tourSteps.tsx
{
  target: '[data-tour="your-element-id"]',
  content: (
    <div>
      <h3 className="font-bold mb-2">Feature Title</h3>
      <p>
        Description of what this feature does and how to use it.
      </p>
    </div>
  ),
  placement: "bottom", // or "top", "left", "right"
}
```

Then add the `data-tour` attribute to your component:

```tsx
<Button data-tour="your-element-id">
  Your Button
</Button>
```

#### Customizing Tour Styles

Modify the `tourStyles` object in `src/components/OnboardingTour.tsx`:

```typescript
const tourStyles: Partial<Styles> = {
  options: {
    primaryColor: "hsl(var(--primary))", // Uses CSS variables
    // ... other options
  },
  // ... other style configurations
};
```

#### Changing Tour Behavior

Modify the `useOnboarding` hook in `src/hooks/useOnboarding.tsx`:

```typescript
// Change initial delay
setTimeout(() => {
  setRun(true);
}, 1000); // 1 second delay

// Change localStorage key
const ONBOARDING_STORAGE_KEY = "your-custom-key";
```

## Best Practices

1. **Keep Steps Concise**: Each tooltip should explain one feature clearly
2. **Use Descriptive Titles**: Bold titles help users scan information
3. **Order Matters**: Arrange steps in logical user journey order
4. **Test on Mobile**: Ensure tooltips display properly on smaller screens
5. **Update Regularly**: When adding features, add corresponding tour steps

## Accessibility

- Tour is keyboard navigable
- Uses semantic HTML in tooltip content
- High contrast for readability
- Can be skipped at any time
- Doesn't block critical functionality

## Future Enhancements

Possible improvements:
- Context-aware tours (show specific tours based on user actions)
- Video tutorials integration
- Interactive challenges/quizzes
- Multi-language support
- Analytics to track tour completion rates
- Conditional steps based on user's existing data

## Troubleshooting

**Tour doesn't start:**
- Check if `expense-tracker-onboarding-completed` exists in localStorage
- Clear it to reset: `localStorage.removeItem("expense-tracker-onboarding-completed")`

**Element not highlighting:**
- Verify the `data-tour` attribute matches the target in tour steps
- Check if element is rendered before tour runs
- Ensure element is visible (not hidden by CSS)

**Styles not applying:**
- Check if CSS variables are defined in your theme
- Verify React Joyride version compatibility
- Inspect browser console for errors

## Support

For issues or questions about the onboarding feature:
1. Check the React Joyride documentation: https://docs.react-joyride.com/
2. Review the implementation files listed above
3. Test in different browsers and screen sizes
