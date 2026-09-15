import { Group, GroupExpense, GroupSettlement, DebtTransfer } from "@/hooks/useGroupExpenses";

export const exportGroupToCSV = (
  group: Group,
  expenses: GroupExpense[],
  settlements: GroupSettlement[],
  balances: Record<string, number>,
  simplifiedDebts: DebtTransfer[]
) => {
  const groupExpensesList = expenses.filter((e) => e.group_id === group.id);
  const groupSettlementsList = settlements.filter((s) => s.group_id === group.id);

  let csvContent = `data:text/csv;charset=utf-8,`;

  // 1. Group Info Header
  csvContent += `Group Expense Report: ${group.name}\n`;
  csvContent += `Generated On: ${new Date().toLocaleDateString("en-IN")}\n`;
  csvContent += `Total Members: ${group.members.join("; ")}\n\n`;

  // 2. Member Balances Section
  csvContent += `--- MEMBER NET BALANCES ---\n`;
  csvContent += `Member,Net Balance (INR),Status\n`;
  Object.entries(balances).forEach(([member, bal]) => {
    const status = bal > 0 ? "Gets back" : bal < 0 ? "Owes" : "Settled";
    csvContent += `"${member}",${bal},"${status}"\n`;
  });
  csvContent += `\n`;

  // 3. Simplified Settle-up Transfers
  csvContent += `--- SETTLE-UP TRANSFERS REQUIRED ---\n`;
  csvContent += `From (Debtor),To (Creditor),Amount (INR)\n`;
  if (simplifiedDebts.length === 0) {
    csvContent += `All members are settled up!,,0\n`;
  } else {
    simplifiedDebts.forEach((transfer) => {
      csvContent += `"${transfer.from}","${transfer.to}",${transfer.amount}\n`;
    });
  }
  csvContent += `\n`;

  // 4. Transaction Log
  csvContent += `--- GROUP TRANSACTIONS LOG ---\n`;
  csvContent += `Date,Title,Category,Total Amount (INR),Paid By / Payers,Member Splits\n`;
  groupExpensesList.forEach((exp) => {
    const payersText = exp.paid_by_map && Object.keys(exp.paid_by_map).length > 0
      ? Object.entries(exp.paid_by_map)
          .map(([p, amt]) => `${p} (₹${amt})`)
          .join(" & ")
      : exp.paid_by;

    const splitsText = Object.entries(exp.splits)
      .map(([m, share]) => `${m}: ₹${share}`)
      .join("; ");

    csvContent += `"${exp.date}","${exp.title}","${exp.category}",${exp.amount},"${payersText}","${splitsText}"\n`;
  });
  csvContent += `\n`;

  // 5. Recorded Settlements
  if (groupSettlementsList.length > 0) {
    csvContent += `--- RECORDED SETTLEMENTS ---\n`;
    csvContent += `Date,Paid By,Paid To,Amount (INR)\n`;
    groupSettlementsList.forEach((set) => {
      csvContent += `"${set.date}","${set.from_member}","${set.to_member}",${set.amount}\n`;
    });
  }

  // Trigger browser download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${group.name.replace(/\s+/g, "_")}_Group_Transactions.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportGroupToPDF = (
  group: Group,
  expenses: GroupExpense[],
  settlements: GroupSettlement[],
  balances: Record<string, number>,
  simplifiedDebts: DebtTransfer[]
) => {
  const groupExpensesList = expenses.filter((e) => e.group_id === group.id);
  const groupSettlementsList = settlements.filter((s) => s.group_id === group.id);
  const totalSpent = groupExpensesList.reduce((sum, e) => sum + e.amount, 0);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${group.name} - Group Expense Report</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #4338ca; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .card-title { font-size: 14px; font-weight: 700; margin-bottom: 8px; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; color: #475569; font-weight: 600; }
          .text-green { color: #16a34a; font-weight: 600; }
          .text-red { color: #dc2626; font-weight: 600; }
          .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${group.icon || "🏖️"} ${group.name}</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString("en-IN")} • Expense Tracker</div>
          </div>
          <div class="badge">Total Spent: ₹${totalSpent.toLocaleString("en-IN")}</div>
        </div>

        <div class="grid">
          <!-- Member Net Balances -->
          <div class="card">
            <div class="card-title">Member Balances</div>
            <table>
              <thead>
                <tr><th>Member</th><th>Net Balance</th></tr>
              </thead>
              <tbody>
                ${Object.entries(balances)
                  .map(([m, bal]) => `
                    <tr>
                      <td>${m}</td>
                      <td class="${bal > 0 ? "text-green" : bal < 0 ? "text-red" : ""}">${bal > 0 ? "+" : ""}₹${bal.toLocaleString("en-IN")}</td>
                    </tr>
                  `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Settle Up Transfers -->
          <div class="card">
            <div class="card-title">Minimal Settle-Up Transfers</div>
            ${simplifiedDebts.length === 0 
              ? `<div style="font-size: 12px; color: #16a34a; padding: 8px 0;">🎉 Everyone is fully settled up!</div>`
              : `<table>
                  <thead><tr><th>From</th><th>To</th><th>Amount</th></tr></thead>
                  <tbody>
                    ${simplifiedDebts.map(t => `
                      <tr>
                        <td><strong>${t.from}</strong></td>
                        <td>${t.to}</td>
                        <td class="text-red">₹${t.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>`
            }
          </div>
        </div>

        <!-- Transactions Log -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title">Group Transactions (${groupExpensesList.length})</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Paid By</th>
                <th>Total</th>
                <th>Split Details</th>
              </tr>
            </thead>
            <tbody>
              ${groupExpensesList.length === 0 
                ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No transactions recorded.</td></tr>`
                : groupExpensesList.map(exp => {
                    const payersText = exp.paid_by_map && Object.keys(exp.paid_by_map).length > 0
                      ? Object.entries(exp.paid_by_map).map(([p, a]) => `${p} (₹${a})`).join(", ")
                      : exp.paid_by;
                    const splitsText = Object.entries(exp.splits).map(([m, a]) => `${m}: ₹${a}`).join(", ");
                    return `
                      <tr>
                        <td>${exp.date}</td>
                        <td><strong>${exp.title}</strong></td>
                        <td>${exp.category}</td>
                        <td>${payersText}</td>
                        <td><strong>₹${exp.amount.toLocaleString("en-IN")}</strong></td>
                        <td style="font-size: 11px; color: #64748b;">${splitsText}</td>
                      </tr>
                    `;
                  }).join("")}
            </tbody>
          </table>
        </div>

        ${groupSettlementsList.length > 0 ? `
          <div class="card">
            <div class="card-title">Recorded Settlements</div>
            <table>
              <thead><tr><th>Date</th><th>Payer</th><th>Receiver</th><th>Amount</th></tr></thead>
              <tbody>
                ${groupSettlementsList.map(s => `
                  <tr>
                    <td>${s.date}</td>
                    <td>${s.from_member}</td>
                    <td>${s.to_member}</td>
                    <td class="text-green">₹${s.amount.toLocaleString("en-IN")}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}

        <div class="footer">
          Expense Tracker • Isolated Group Finance Report • ${group.members.length} Active Members
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
