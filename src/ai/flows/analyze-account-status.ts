'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a customer's account status.
 *
 * - analyzeAccountStatus - A function that calculates the net balance and determines the account status (Credit, Debit, or Settled).
 * - AnalyzeAccountStatusInput - The input type for the analyzeAccountStatus function.
 * - AnalyzeAccountStatusOutput - The return type for the analyzeAccountStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAccountStatusInputSchema = z.object({
  receivable: z
    .number()
    .describe('Total amount receivable (credit) from the customer.'),
  payable: z.number().describe('Total amount payable (debit) to the customer.'),
});
export type AnalyzeAccountStatusInput = z.infer<
  typeof AnalyzeAccountStatusInputSchema
>;

const AnalyzeAccountStatusOutputSchema = z.object({
  netBalance: z.number().describe('The net balance (Receivable - Payable).'),
  accountStatus:
    z.enum(['Credit', 'Debit', 'Settled']).describe('The account status.'),
});
export type AnalyzeAccountStatusOutput = z.infer<
  typeof AnalyzeAccountStatusOutputSchema
>;

export async function analyzeAccountStatus(
  input: AnalyzeAccountStatusInput
): Promise<AnalyzeAccountStatusOutput> {
  return analyzeAccountStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAccountStatusPrompt',
  input: {schema: AnalyzeAccountStatusInputSchema},
  output: {schema: AnalyzeAccountStatusOutputSchema},
  prompt: `You are an accounting expert. Given the receivable (credit) and payable (debit) amounts for a customer, determine the net balance and account status.

Receivable (Credit): {{receivable}}
Payable (Debit): {{payable}}

Calculate the net balance (Receivable - Payable). Then, determine the account status based on the following rules:
- If the net balance is positive, the account status is "Credit".
- If the net balance is negative, the account status is "Debit".
- If the net balance is zero, the account status is "Settled".

Return the net balance and account status.
`,
});

const analyzeAccountStatusFlow = ai.defineFlow(
  {
    name: 'analyzeAccountStatusFlow',
    inputSchema: AnalyzeAccountStatusInputSchema,
    outputSchema: AnalyzeAccountStatusOutputSchema,
  },
  async input => {
    const netBalance = input.receivable - input.payable;
    let accountStatus: 'Credit' | 'Debit' | 'Settled';

    if (netBalance > 0) {
      accountStatus = 'Credit';
    } else if (netBalance < 0) {
      accountStatus = 'Debit';
    } else {
      accountStatus = 'Settled';
    }

    return {
      netBalance: netBalance,
      accountStatus: accountStatus,
    };
  }
);
