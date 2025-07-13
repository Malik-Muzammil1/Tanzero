"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useApp } from '@/hooks/use-app';
import { Transaction } from '@/lib/types';
import { useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  productName: z.string().min(2, "Product/Service name is required."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  type: z.enum(['receivable', 'payable']),
});

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  transaction?: Transaction | null;
}

export function TransactionForm({ isOpen, onClose, customerId, transaction }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useApp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      amount: 0,
      type: 'receivable',
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        productName: transaction.productName,
        amount: transaction.receivable > 0 ? transaction.receivable : transaction.payable,
        type: transaction.receivable > 0 ? 'receivable' : 'payable',
      });
    } else {
      form.reset({
        productName: '',
        amount: 0,
        type: 'receivable',
      });
    }
  }, [transaction, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const transactionData = {
      productName: values.productName,
      receivable: values.type === 'receivable' ? values.amount : 0,
      payable: values.type === 'payable' ? values.amount : 0,
    };
    
    if (transaction) {
        updateTransaction(customerId, { ...transaction, ...transactionData });
    } else {
        addTransaction(customerId, transactionData);
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Transaction Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="receivable" />
                        </FormControl>
                        <FormLabel className="font-normal text-emerald-600">Receivable (Credit)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="payable" />
                        </FormControl>
                        <FormLabel className="font-normal text-red-600">Payable (Debit)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product / Service</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Web Development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">{transaction ? 'Save Changes' : 'Add Transaction'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
