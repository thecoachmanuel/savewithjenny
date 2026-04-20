'use client'

import React, { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { requestLoan } from '@/lib/loan-actions';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useRouter } from 'next/navigation';

interface LoanRequestFormProps {
  memberships: any[];
  maxEligibleAmount: number;
}

export function LoanRequestForm({ memberships, maxEligibleAmount }: LoanRequestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await requestLoan(formData);
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        router.push('/dashboard/loans');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      
      <Card className="glass shadow-lg">
        <div className="badge badge-success" style={{ marginBottom: '1.5rem', width: '100%', textTransform: 'none', justifyContent: 'center', padding: '0.75rem' }}>
          Your current max limit: <strong>{formatCurrency(maxEligibleAmount)}</strong>
        </div>

        <div className="input-group">
          <label className="label">Select Thrift Group</label>
          <select name="groupId" className="input" required defaultValue="">
            <option value="" disabled>Select a group...</option>
            {memberships?.map((m: any) => (
              <option key={m.group_id} value={m.group_id}>
                {m.groups.name} (₦{m.groups.contribution_amount.toLocaleString()} / freq)
              </option>
            ))}
          </select>
        </div>

        <Input 
          label="Loan Amount (₦)" 
          name="amount" 
          type="number" 
          placeholder="e.g. 100000" 
          max={maxEligibleAmount}
          required 
        />

        <div className="input-group">
          <label className="label">Purpose of Loan</label>
          <textarea 
            name="purpose"
            className="input"
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder="Briefly explain what the funds will be used for..."
            required
          ></textarea>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Button type="submit" disabled={isPending || maxEligibleAmount <= 0} style={{ width: '100%', padding: '1rem' }}>
            {isPending ? <Loader2 className="animate-spin" size={20} /> : 'Submit Loan Application'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
