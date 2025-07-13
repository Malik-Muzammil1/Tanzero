import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Currency, Customer, Transaction } from "@/lib/types";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Currency) {
  const symbolMap: Record<Currency, string> = {
    PKR: '₨',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  const formattedAmount = `${symbolMap[currency]}${absoluteAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  
  return isNegative ? `-${formattedAmount}` : formattedAmount;
}

const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- CSV Export Functions ---
const convertToCsv = (customers: Customer[]): string => {
    const header = [
        'CustomerID', 'CustomerName', 'PhoneNumber', 'DateAdded', 'LastEdited', 'DateRemoved',
        'TransactionID', 'TransactionDate', 'Product/Service', 'Receivable', 'Payable', 'Status'
    ];
    
    const rows = customers.flatMap(customer => {
        if(customer.transactions.length === 0) {
            return [[
                customer.id, customer.name, customer.phoneNumber || '', customer.dateAdded, customer.lastEdited, customer.dateRemoved || '',
                '', '', '', '', '', ''
            ]];
        }
        return customer.transactions.map(t => [
            customer.id, customer.name, customer.phoneNumber || '', customer.dateAdded, customer.lastEdited, customer.dateRemoved || '',
            t.id, t.date, t.productName, t.receivable, t.payable, t.status
        ]);
    });

    const csvContent = [
        header.join(','),
        ...rows.map(row => row.map(item => `"${String(item ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
}

export const exportAllToCsv = (customers: Customer[]) => {
    const csv = convertToCsv(customers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'tranzero-backup.csv');
}

export const exportCustomerToCsv = (customer: Customer) => {
    const csv = convertToCsv([customer]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-t;' });
    downloadFile(blob, `${customer.name}-transactions.csv`);
}


// --- PDF Export Functions ---
export const exportAllToPdf = (customers: Customer[], currency: Currency) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('All Customers Summary', 14, 22);
    
    const head = [['ID', 'Name', 'Total Receivable', 'Total Payable', 'Net Balance']];
    const body = customers.filter(c => !c.dateRemoved).map(c => {
        const summary = c.transactions.filter(t => t.status === 'unpaid').reduce((acc, t) => {
            acc.receivable += t.receivable;
            acc.payable += t.payable;
            return acc;
        }, { receivable: 0, payable: 0 });
        const netBalance = summary.receivable - summary.payable;
        return [
            c.id,
            c.name,
            formatCurrency(summary.receivable, currency),
            formatCurrency(summary.payable, currency),
            formatCurrency(netBalance, currency)
        ];
    });

    autoTable(doc, {
        head: head,
        body: body,
        startY: 30
    });

    doc.save('tranzero-all-customers.pdf');
}

export const exportCustomerToPdf = (customer: Customer, currency: Currency) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(customer.name, 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 14, 30);
    if(customer.phoneNumber) {
        doc.text(`Phone: ${customer.phoneNumber}`, 14, 35);
    }
    
    // Summary
    const summary = customer.transactions.filter(t => t.status === 'unpaid').reduce((acc, t) => {
        acc.receivable += t.receivable;
        acc.payable += t.payable;
        return acc;
    }, { receivable: 0, payable: 0 });
    const netBalance = summary.receivable - summary.payable;
    
    const summaryY = customer.phoneNumber ? 45 : 40;

    doc.text(`Total Receivable: ${formatCurrency(summary.receivable, currency)}`, 14, summaryY);
    doc.text(`Total Payable: ${formatCurrency(summary.payable, currency)}`, 14, summaryY + 5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Outstanding Balance: ${formatCurrency(netBalance, currency)}`, 14, summaryY + 15);

    // Transactions Table
    const head = [['Date', 'Product/Service', 'Receivable', 'Payable', 'Status']];
    const body = customer.transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.productName,
        t.receivable > 0 ? formatCurrency(t.receivable, currency) : '-',
        t.payable > 0 ? formatCurrency(t.payable, currency) : '-',
        t.status
    ]);

    autoTable(doc, {
        head: head,
        body: body,
        startY: summaryY + 25,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save(`${customer.name}-statement.pdf`);
}

// --- Activity Log Function ---
export const logActivity = async (
    teamId: string, 
    userId: string, 
    userDisplayName: string, 
    action: string, 
    details: Record<string, any>
) => {
    if(!teamId || !userId || !userDisplayName) return;

    try {
        const logCollectionRef = collection(db, `teams/${teamId}/activityLogs`);
        await addDoc(logCollectionRef, {
            action,
            details,
            userId,
            userDisplayName,
            timestamp: serverTimestamp()
        });
    } catch(error) {
        console.error("Failed to log activity:", error);
        // We don't want to block user actions if logging fails, so we just log the error.
    }
}
