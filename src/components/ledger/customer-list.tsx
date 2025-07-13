"use client";

import React, { useMemo, useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortKey, Customer, Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const getTransactionBalance = (t: Transaction) => {
    const totalPaid = (t.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const totalDue = t.receivable > 0 ? t.receivable : t.payable;
    return totalDue - totalPaid;
}

const calculateNetBalance = (customer: Customer) => {
  return customer.transactions
    .reduce((acc, t) => {
        const balance = getTransactionBalance(t);
        if (t.receivable > 0) return acc + balance;
        if (t.payable > 0) return acc - balance;
        return acc;
    }, 0);
};

export function CustomerList({ onCustomerSelect }: { onCustomerSelect?: () => void }) {
  const { customers, activeCustomerId, setActiveCustomerId, searchQuery, setSearchQuery, sortKey, setSortKey } = useApp();

  const handleCustomerClick = (id: string) => {
    setActiveCustomerId(id);
    onCustomerSelect?.();
  };

  const filteredAndSortedCustomers = useMemo(() => {
    const activeCustomers = customers.filter(c => !c.dateRemoved);
    
    const filtered = activeCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortKey === 'netBalance') {
        return calculateNetBalance(b) - calculateNetBalance(a);
      }
      if (sortKey === 'lastEdited') {
        return new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime();
      }
      return 0;
    });
  }, [customers, searchQuery, sortKey]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-background"
        />
        <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastEdited">Last Active</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="netBalance">Balance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <nav className="flex flex-col gap-1">
        {filteredAndSortedCustomers.length > 0 ? (
          filteredAndSortedCustomers.map(customer => (
            <CustomerListItem 
              key={customer.id} 
              customer={customer}
              isActive={customer.id === activeCustomerId}
              onClick={() => handleCustomerClick(customer.id)}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center text-sm mt-4">No customers found.</p>
        )}
      </nav>
    </div>
  );
}


function CustomerListItem({ customer, isActive, onClick }: { customer: Customer; isActive: boolean; onClick: () => void; }) {
  const { currency } = useApp();
  const netBalance = useMemo(() => calculateNetBalance(customer), [customer]);

  const { totalReceivable, totalPayable } = useMemo(() => {
    return customer.transactions
      .reduce((acc, t) => {
        const balance = getTransactionBalance(t);
        if (t.receivable > 0) acc.totalReceivable += balance;
        if (t.payable > 0) acc.totalPayable += balance;
        return acc;
    }, { totalReceivable: 0, totalPayable: 0 });
  }, [customer.transactions]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-accent"
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold truncate">{customer.name}</h3>
        <p className={cn("font-mono text-sm", netBalance > 0 ? "text-emerald-600" : netBalance < 0 ? "text-red-600" : "text-muted-foreground")}>
          {formatCurrency(netBalance, currency)}
        </p>
      </div>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-muted-foreground">
          Last active: {new Date(customer.lastEdited).toLocaleDateString()}
        </p>
        <StatusBadge receivable={totalReceivable} payable={totalPayable} />
      </div>
    </button>
  );
}
