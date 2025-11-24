import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/hooks/useExpenseData";

export const exportToCSV = (transactions: Transaction[], filename = "transactions.csv") => {
  // Create CSV header
  const headers = ["Date", "Description", "Category", "Type", "Amount (₹)"];
  
  // Create CSV rows
  const rows = transactions.map(transaction => [
    new Date(transaction.date).toLocaleDateString('en-IN'),
    transaction.description,
    transaction.category,
    transaction.type,
    transaction.amount.toFixed(2)
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => 
      row.map(cell => 
        // Escape cells that contain commas or quotes
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(",")
    )
  ].join("\n");
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (transactions: Transaction[], filename = "transactions.pdf") => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text("Transaction History", 14, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Add summary
  doc.setFontSize(11);
  doc.text(`Total Income: ₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, 36);
  doc.text(`Total Expenses: ₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, 42);
  doc.text(`Net Balance: ₹${(totalIncome - totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, 48);
  
  // Prepare table data
  const tableData = transactions.map(transaction => [
    new Date(transaction.date).toLocaleDateString('en-IN'),
    transaction.description,
    transaction.category,
    transaction.type === "income" ? "Income" : "Expense",
    `₹${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  ]);
  
  // Add table
  autoTable(doc, {
    head: [["Date", "Description", "Category", "Type", "Amount"]],
    body: tableData,
    startY: 55,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: function(data) {
      // Color-code transaction types
      if (data.section === 'body' && data.column.index === 3) {
        const cellText = data.cell.text[0];
        if (cellText === 'Income') {
          data.cell.styles.textColor = [34, 197, 94]; // Green
        } else if (cellText === 'Expense') {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        }
      }
    }
  });
  
  // Save PDF
  doc.save(filename);
};
