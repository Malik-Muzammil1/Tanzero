"use client";

import { useEffect, useState } from 'react';
import { analyzeAccountStatus } from '@/ai/flows/analyze-account-status';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Status = 'Credit' | 'Debit' | 'Settled';

export function StatusBadge({ receivable, payable }: { receivable: number; payable: number; }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStatus = async () => {
      setLoading(true);
      try {
        const result = await analyzeAccountStatus({ receivable, payable });
        setStatus(result.accountStatus);
      } catch (error) {
        console.error("Failed to analyze account status:", error);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };
    getStatus();
  }, [receivable, payable]);

  if (loading) {
    return <Skeleton className="h-5 w-14 rounded-full" />;
  }

  if (!status) return null;

  return (
    <Badge
      variant="outline"
      className={cn({
        "text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-700 dark:bg-emerald-950": status === 'Credit',
        "text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-700 dark:bg-red-950": status === 'Debit',
        "text-gray-700 border-gray-300 bg-gray-50 dark:text-gray-300 dark:border-gray-700 dark:bg-gray-950": status === 'Settled',
      })}
    >
      {status}
    </Badge>
  );
}
