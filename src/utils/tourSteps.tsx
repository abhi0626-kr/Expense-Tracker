import { Step } from "react-joyride";

export const dashboardTourSteps: Step[] = [
  {
    target: "body",
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">Welcome to Expense Tracker! 🎉</h2>
        <p className="mb-2">
          Let's take a quick tour to help you get started with managing your finances effectively.
        </p>
        <p className="text-sm text-muted-foreground">
          You can skip this tour anytime or restart it later from your profile settings.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-transaction"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Add Transaction</h3>
        <p>
          Click here to add a new income or expense transaction. Track every rupee that comes in or goes out!
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="transfer-funds"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Transfer Between Accounts</h3>
        <p>
          Use this to transfer money between your accounts. Perfect for moving funds from your savings to checking account or vice versa.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="features-button"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Advanced Features</h3>
        <p>
          Access powerful tools like Budget Manager, Recurring Transactions, Currency Converter, Investment Tracker, Receipt Scanner, and data Import/Export.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Budget alerts will show up here when you're close to exceeding your limits!
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="profile-button"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Profile Settings</h3>
        <p>
          Manage your profile, update your personal information, change your profile picture, and customize your experience.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Theme Toggle</h3>
        <p>
          Switch between light and dark mode to suit your preference and reduce eye strain.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="signout-button"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Sign Out</h3>
        <p>
          Click here to securely log out of your account when you're done.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="total-balance"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Total Balance</h3>
        <p>
          This shows the sum of all your account balances. Get a quick overview of your total wealth at a glance.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="total-income"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Total Income</h3>
        <p>
          Track all the money you've earned. This includes salary, bonuses, gifts, and any other income sources.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="total-expenses"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Total Expenses</h3>
        <p>
          Monitor your spending. Keep an eye on where your money goes to make better financial decisions.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="accounts-section"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Your Accounts</h3>
        <p>
          View and manage all your financial accounts - Bank, Cash, Credit Card, Savings, or Wallet. Click on any account card to edit it.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="spending-trend"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Spending Trend</h3>
        <p>
          Visualize your spending patterns over time. This line chart helps you identify trends and seasonal variations in your expenses.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="category-trend"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Category Breakdown</h3>
        <p>
          See which categories you spend the most on. This helps you understand your spending habits better.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="weekly-comparison"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Weekly Comparison</h3>
        <p>
          Compare your spending across different weeks. Track if you're spending more or less than usual.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="monthly-comparison"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Monthly Comparison</h3>
        <p>
          View your monthly spending patterns. Perfect for identifying months where you need to be more careful with your budget.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="spending-chart"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Category Distribution</h3>
        <p>
          This pie chart shows the percentage breakdown of your spending by category. See exactly where your money goes!
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="transaction-list"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Recent Transactions</h3>
        <p>
          View your latest transactions here. Click on any transaction to see details or delete it if needed. Click "View All" to see your complete transaction history.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: "body",
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">You're All Set! 🚀</h2>
        <p className="mb-2">
          You now know how to use all the main features of Expense Tracker!
        </p>
        <p className="text-sm text-muted-foreground">
          Don't forget to explore the Features page for advanced tools like budgets, recurring transactions, investments, and more!
        </p>
      </div>
    ),
    placement: "center",
  },
];

export const featuresTourSteps: Step[] = [
  {
    target: '[data-tour="back-to-dashboard"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Back to Dashboard</h3>
        <p>
          Return to your main dashboard anytime to see your overview and recent activity.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="accounts-tab"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Account Manager</h3>
        <p>
          Create, edit, and manage all your financial accounts. Add new accounts like bank accounts, credit cards, cash wallets, and more.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="budgets-tab"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Budget Manager</h3>
        <p>
          Set monthly budgets for different categories to control your spending. Get alerts when you're approaching or exceeding your limits!
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="recurring-tab"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Recurring Transactions</h3>
        <p>
          Set up automatic transactions for subscriptions, bills, salary, and other recurring income or expenses. Never forget a payment again!
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="currency-tab"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Currency Converter</h3>
        <p>
          Convert between different currencies with real-time exchange rates. Perfect for international transactions or travel planning!
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="export-tab"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Export & Import</h3>
        <p>
          Export your data to CSV or Excel for backup or analysis. Import transactions from spreadsheets to quickly populate your data.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">Features Tour Complete! 🎉</h2>
        <p className="mb-2">
          You now know all the advanced features available in Expense Tracker!
        </p>
        <p className="text-sm text-muted-foreground">
          Start using these tools to take full control of your finances.
        </p>
      </div>
    ),
    placement: "center",
  },
];
