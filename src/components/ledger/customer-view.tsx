"use client";

import { useMemo, useState, Fragment } from 'react';
import { Customer, Transaction, Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle, Trash2, Edit, Download, MessageSquare, X, CheckCircle, CircleDotDashed, ShoppingBag, ChevronDown, Wallet, History, Banknote } from 'lucide-react';
import { formatCurrency, cn, exportCustomerToCsv, exportCustomerToPdf } from '@/lib/utils';
import { useApp } from '@/hooks/use-app';
import { StatusBadge } from './status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionForm } from './transaction-form';
import { CustomerForm } from './customer-form';
import { PaymentForm } from './payment-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

const getTransactionBalance = (t: Transaction) => {
    const totalPaid = (t.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const totalDue = t.receivable > 0 ? t.receivable : t.payable;
    return totalDue - totalPaid;
}

export function CustomerView({ customer }: { customer: Customer }) {
  const { currency, softDeleteCustomer, userProfile, bulkUpdateTransactionStatus, bulkDeleteTransactions } = useApp();
  const { toast } = useToast();
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionForPayment, setTransactionForPayment] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useState(() => {
    setSelectedIds([]);
  });

  const summary = useMemo(() => {
    return customer.transactions
      .reduce(
      (acc, t) => {
        const balance = getTransactionBalance(t);
        if (t.receivable > 0) {
            acc.totalReceivable += balance;
        } else if (t.payable > 0) {
            acc.totalPayable += balance;
        }
        return acc;
      },
      { totalReceivable: 0, totalPayable: 0 }
    );
  }, [customer.transactions]);

  const productSummary = useMemo(() => {
    const productCounts = customer.transactions.reduce((acc, t) => {
      acc[t.productName] = (acc[t.productName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [customer.transactions]);

  const netBalance = summary.totalReceivable - summary.totalPayable;
  
  const handleNotifyWhatsApp = () => {
    if (!customer.phoneNumber) {
      toast({ variant: "destructive", title: "Missing Phone Number", description: "Please add a phone number for this customer first."});
      return;
    }
    if (!userProfile?.displayName) {
        toast({ variant: "destructive", title: "Missing Profile Name", description: "Please set your display name in your profile first."});
        return;
    }

    const formattedPhone = customer.phoneNumber.replace(/\D/g, '');
    const message = `Hello ${customer.name}. This is a friendly reminder from ${userProfile.displayName} regarding your account. Your current outstanding balance is ${formatCurrency(netBalance, currency)}. Thank you.`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionFormOpen(true);
  }

  const handleAddPayment = (transaction: Transaction) => {
    setTransactionForPayment(transaction);
    setIsPaymentFormOpen(true);
  }

  const handleAddNewTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionFormOpen(true);
  }
  
  const handleCloseForms = () => {
    setEditingTransaction(null);
    setIsTransactionFormOpen(false);
    setTransactionForPayment(null);
    setIsPaymentFormOpen(false);
  }

  const handleBulkMarkPaid = async () => {
      await bulkUpdateTransactionStatus(customer.id, selectedIds, 'paid');
      setSelectedIds([]);
  };

  const handleBulkMarkUnpaid = async () => {
      await bulkUpdateTransactionStatus(customer.id, selectedIds, 'unpaid');
      setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
      await bulkDeleteTransactions(customer.id, selectedIds);
      setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-headline">{customer.name}</h2>
          <p className="text-sm text-muted-foreground">
            Customer since {new Date(customer.dateAdded).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button onClick={handleAddNewTransaction}><PlusCircle /> Add Transaction</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsCustomerFormOpen(true)}><Edit /> Edit Customer</DropdownMenuItem>
               <DropdownMenuItem onClick={handleNotifyWhatsApp} disabled={!customer.phoneNumber}>
                  <MessageSquare /> Notify on WhatsApp
              </DropdownMenuItem>
              <DropdownMenuSub>
                  <DropdownMenuSubTrigger><Download/> Export Data</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => exportCustomerToPdf(customer, currency)}>Export as PDF</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportCustomerToCsv(customer)}>Export as CSV</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive"><Trash2 /> Delete Customer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-base font-medium">Outstanding Balance</CardTitle></CardHeader>
            <CardContent>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>{formatCurrency(netBalance, currency)}</p>
                <div className="mt-1"><StatusBadge receivable={summary.totalReceivable} payable={summary.totalPayable} /></div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-base font-medium">Total Receivable</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalReceivable, currency)}</p></CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-base font-medium">Total Payable</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPayable, currency)}</p></CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2"><ShoppingBag className="w-4 h-4"/>Product Summary</CardTitle>
            </CardHeader>
            <CardContent>
                {productSummary.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {productSummary.map(([name, count]) => (
                      <Badge key={name} variant="secondary">{name} ({count})</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No products yet.</p>
                )}
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedIds.length > 0 && (
            <BulkActionsToolbar
                count={selectedIds.length}
                onMarkPaid={handleBulkMarkPaid}
                onMarkUnpaid={handleBulkMarkUnpaid}
                onDelete={handleBulkDelete}
                onClear={() => setSelectedIds([])}
            />
          )}
          <TransactionList transactions={customer.transactions} onEdit={handleEditTransaction} onAddPayment={handleAddPayment} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
        </CardContent>
      </Card>
      
      <TransactionForm isOpen={isTransactionFormOpen} onClose={handleCloseForms} customerId={customer.id} transaction={editingTransaction} />
      <CustomerForm isOpen={isCustomerFormOpen} onClose={() => setIsCustomerFormOpen(false)} customer={customer} />
      {transactionForPayment && <PaymentForm isOpen={isPaymentFormOpen} onClose={handleCloseForms} transaction={transactionForPayment} customerId={customer.id} />}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the customer and their records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => softDeleteCustomer(customer.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BulkActionsToolbar({ count, onMarkPaid, onMarkUnpaid, onDelete, onClear }: {
  count: number;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
      <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-secondary border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClear}><X className="h-5 w-5"/></Button>
            <p className="text-sm font-medium">{count} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onMarkPaid}><CheckCircle/> Mark as Paid</Button>
            <Button variant="outline" size="sm" onClick={onMarkUnpaid}><CircleDotDashed/> Mark as Unpaid</Button>
            <Button variant="destructive" size="sm" onClick={onDelete}><Trash2/> Delete</Button>
          </div>
      </div>
  )
}

function TransactionList({ transactions, onEdit, onAddPayment, selectedIds, setSelectedIds }: { transactions: Transaction[], onEdit: (t: Transaction) => void, onAddPayment: (t: Transaction) => void, selectedIds: string[], setSelectedIds: React.Dispatch<React.SetStateAction<string[]>> }) {
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

  if(transactions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
  }

  const handleSelectAll = () => {
    const allIds = sortedTransactions.map(t => t.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };
  
  const allSelected = sortedTransactions.length > 0 && sortedTransactions.every(id => selectedIds.includes(id.id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds(currentIds =>
      currentIds.includes(id)
        ? currentIds.filter(currentId => currentId !== id)
        : [...currentIds, id]
    );
  };

  return (
    <div className="overflow-x-auto -mx-6">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                    <Checkbox 
                        onCheckedChange={handleSelectAll} 
                        checked={allSelected} 
                        aria-label="Select all transactions"
                        disabled={sortedTransactions.length === 0}
                    />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product/Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
        </Table>
        <Accordion type="multiple" className="w-full">
            {sortedTransactions.map(t => (
                <TransactionRow key={t.id} transaction={t} onEdit={onEdit} onAddPayment={onAddPayment} isSelected={selectedIds.includes(t.id)} onSelect={() => handleToggleSelect(t.id)} />
            ))}
        </Accordion>
    </div>
  );
}

function TransactionRow({ transaction, onEdit, onAddPayment, isSelected, onSelect }: { transaction: Transaction; onEdit: (t: Transaction) => void; onAddPayment: (t: Transaction) => void; isSelected: boolean; onSelect: () => void; }) {
    const { currency, deleteTransaction, deletePayment, activeCustomerId } = useApp();
    const t = transaction;
    const balance = getTransactionBalance(t);
    const totalAmount = t.receivable > 0 ? t.receivable : t.payable;

    const isCredit = t.receivable > 0;
    
    return (
      <AccordionItem value={t.id} className="border-b-0">
         <div className={cn("flex items-center border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", isSelected && 'bg-primary/10')}>
            <div className="p-4 px-6 align-middle [&:has([role=checkbox])]:pr-0">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onSelect}
                    aria-label="Select transaction"
                />
            </div>
            <div className="p-4 px-6 align-middle w-[110px]">{new Date(t.date).toLocaleDateString()}</div>
            <div className="p-4 px-6 align-middle font-medium flex-1">{t.productName}</div>
            <div className="p-4 px-6 align-middle w-[110px]">
                <Badge variant={t.status === 'paid' ? 'default' : t.status === 'partial' ? 'secondary' : 'outline'}
                    className={cn({
                        "text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-700 dark:bg-emerald-950": t.status === 'paid',
                        "text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950": t.status === 'partial',
                        "text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-700 dark:bg-red-950": t.status === 'unpaid',
                    })}
                >
                    {t.status}
                </Badge>
            </div>
            <div className={cn("p-4 px-6 align-middle w-[150px] text-right font-mono", isCredit ? "text-emerald-600" : "text-red-600")}>
                {formatCurrency(balance, currency)}
            </div>
            <div className="p-4 px-6 align-middle w-[150px] text-right font-mono text-muted-foreground">{formatCurrency(totalAmount, currency)}</div>
            <div className="p-4 px-6 align-middle w-[100px] text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAddPayment(t)} disabled={t.status === 'paid'}><Wallet/> Add Payment</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(t)}><Edit /> Edit Transaction</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => activeCustomerId && deleteTransaction(activeCustomerId, t.id)} className="text-destructive focus:text-destructive"><Trash2 /> Delete Transaction</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                 {(t.payments || []).length > 0 && (
                    <AccordionTrigger>
                        <span className="sr-only">Show payment history</span>
                    </AccordionTrigger>
                 )}
            </div>
        </div>
        <AccordionContent>
            <div className="bg-secondary/50 p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm"><History/> Payment History</h4>
                {(t.payments || []).length > 0 ? (
                <Table>
                    <TableHeader>
                       <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                    {t.payments.map((p) => (
                        <TableRow key={p.id}>
                            <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(p.amount, currency)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => activeCustomerId && deletePayment(activeCustomerId, t.id, p.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No payments recorded for this transaction.</p>
                )}
            </div>
        </AccordionContent>
      </AccordionItem>
    );
}
