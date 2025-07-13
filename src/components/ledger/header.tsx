"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Scale, Upload, Download, MoreVertical } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { CustomerForm } from './customer-form';
import { Currency, Customer } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { exportAllToCsv, exportAllToPdf } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { currency, setCurrency, customers, importCustomers } = useApp();
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const customersMap = new Map<string, Customer>();
            for (const row of results.data as any[]) {
                if (!row.CustomerID || !row.CustomerName) continue;
                
                let customer = customersMap.get(row.CustomerID);
                if (!customer) {
                    customer = {
                        id: row.CustomerID,
                        name: row.CustomerName,
                        phoneNumber: row.PhoneNumber || '',
                        dateAdded: row.DateAdded,
                        lastEdited: row.LastEdited,
                        dateRemoved: row.DateRemoved || null,
                        transactions: [],
                    };
                    customersMap.set(customer.id, customer);
                }

                if(row.TransactionID) {
                    customer.transactions.push({
                        id: row.TransactionID,
                        productName: row['Product/Service'],
                        receivable: parseFloat(row.Receivable) || 0,
                        payable: parseFloat(row.Payable) || 0,
                        date: row.TransactionDate,
                        status: row.Status as 'paid' | 'unpaid' | 'partial',
                        payments: [],
                    });
                }
            }
            importCustomers(Array.from(customersMap.values()));
          } catch (e: any) {
             toast({ variant: "destructive", title: "Import Failed", description: e.message || "Could not parse the file." });
          }
        },
        error: (error: any) => {
          toast({ variant: "destructive", title: "Import Failed", description: error.message });
        }
      });
      event.target.value = '';
    }
  };

  return (
    <>
      <header className="p-4 border-b bg-background sticky top-0 z-10 space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Scale className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold font-headline text-foreground">Tranzero</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleImportClick}><Upload /> Import from CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAllToCsv(customers)}><Download/> Export all as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAllToPdf(customers, currency)}><Download/> Export all as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
            <Button className="flex-1" onClick={() => setIsCustomerFormOpen(true)}>
                <PlusCircle /> New Customer
            </Button>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="PKR">₨ PKR</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
        />
      </header>
      <CustomerForm isOpen={isCustomerFormOpen} onClose={() => setIsCustomerFormOpen(false)} />
    </>
  );
}
