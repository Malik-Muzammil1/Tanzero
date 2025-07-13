
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useApp } from '@/hooks/use-app';
import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be a positive number."),
});

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  transaction: Transaction;
}

export function PaymentForm({ isOpen, onClose, customerId, transaction }: PaymentFormProps) {
  const { addPayment, currency } = useApp();

  const remainingBalance = useMemo(() => {
    const totalPaid = (transaction.payments || []).reduce((acc, p) => acc + p.amount, 0);
    return (transaction.receivable > 0 ? transaction.receivable : transaction.payable) - totalPaid;
  }, [transaction]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema.refine(data => data.amount <= remainingBalance, {
      message: "Payment cannot exceed the remaining balance.",
      path: ["amount"],
    })),
    defaultValues: {
      amount: remainingBalance,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addPayment(customerId, transaction.id, values.amount);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payment for transaction: <strong>{transaction.productName}</strong>.
            <br/>
            Remaining Balance: {formatCurrency(remainingBalance, currency)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} autoFocus/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
