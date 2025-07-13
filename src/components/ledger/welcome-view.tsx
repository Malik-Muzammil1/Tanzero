"use client";

import { useMemo } from 'react';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Scale, Users } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Customer } from '@/lib/types';

export function WelcomeView() {
  const { customers, currency, setActiveCustomerId } = useApp();

  const summary = useMemo(() => {
    const activeCustomers = customers.filter(c => !c.dateRemoved);
    const result = activeCustomers.reduce(
      (acc, customer) => {
        (customer.transactions || []).forEach(t => {
            const totalPaid = (t.payments || []).reduce((sum, p) => sum + p.amount, 0);
            if (t.receivable > 0) {
                acc.totalReceivables += t.receivable - totalPaid;
            } else {
                acc.totalPayables += t.payable - totalPaid;
            }
        });
        return acc;
      },
      { totalReceivables: 0, totalPayables: 0, activeCustomerCount: activeCustomers.length }
    );
    return result;
  }, [customers]);

  const chartData = useMemo(() => {
    const activeCustomers = customers.filter(c => !c.dateRemoved);
    return activeCustomers.map(customer => {
        const balance = (customer.transactions || []).reduce((acc, t) => {
            const totalPaid = (t.payments || []).reduce((sum, p) => sum + p.amount, 0);
            if(t.receivable > 0) return acc + (t.receivable - totalPaid);
            if(t.payable > 0) return acc - (t.payable - totalPaid);
            return acc;
        }, 0);
        return {
            id: customer.id,
            name: customer.name,
            balance: balance,
        };
    })
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);
  }, [customers]);

  const netFlow = summary.totalReceivables - summary.totalPayables;

  const chartConfig = {
    balance: {
      label: 'Balance',
      color: 'hsl(var(--chart-1))',
    },
  };

  if(customers.filter(c => !c.dateRemoved).length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-secondary/30 rounded-lg">
            <Scale className="w-24 h-24 text-primary/70 mb-4" />
            <h2 className="text-3xl font-bold font-headline mb-2">Welcome to Tranzero</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                This is your central hub for managing customer accounts. Add a new customer to get started.
            </p>
         </div>
      )
  }

  return (
    <div className="space-y-6">
        <div className="space-y-1">
            <h2 className="text-3xl font-bold font-headline">Dashboard</h2>
            <p className="text-muted-foreground">A real-time overview of your ledger.</p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalReceivables, currency)}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPayables, currency)}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Outstanding</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-foreground' : 'text-destructive'}`}>{formatCurrency(netFlow, currency)}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summary.activeCustomerCount}</div>
            </CardContent>
            </Card>
        </div>
         <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Top 5 Customers by Balance</CardTitle>
                <CardDescription>
                    Showing customers with the highest outstanding receivable balance.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 10, right: 30 }}
                            >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                width={120}
                                className="text-sm text-muted-foreground"
                            />
                            <XAxis dataKey="balance" type="number" hide />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--accent))' }}
                                content={<ChartTooltipContent
                                    formatter={(value) => formatCurrency(value as number, currency)}
                                    indicator="dot"
                                />}
                            />
                            <Bar dataKey="balance" radius={4} fill="var(--color-balance)" onClick={(d) => setActiveCustomerId(d.id)} className="cursor-pointer" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
