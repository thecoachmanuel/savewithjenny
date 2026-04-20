'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, AlertTriangle, RefreshCcw } from 'lucide-react';
import { pushNextCycle } from '@/lib/payout-actions';
import { useRouter } from 'next/navigation';

interface PushNextCycleFormProps {
  groupId: string;
  groupSlug: string;
  currentCycle: number;
  totalMembers: number;
}

export function PushNextCycleForm({ groupId, groupSlug, currentCycle, totalMembers }: PushNextCycleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorStatus, setErrorStatus] = useState<{ message: string, code?: string, details?: any } | null>(null);
  const router = useRouter();
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handlePush = (allowUnpaid: boolean = false) => {
    if (!isMounted.current) return;
    
    // Safety check for finishing rotation
    const isLastRound = currentCycle >= totalMembers;
    if (isLastRound && !allowUnpaid) {
      if (!confirm("Are you sure you want to FINISH this rotation? This will close the group and mark all rounds as completed.")) {
        return;
      }
    }

    setErrorStatus(null);
    startTransition(async () => {
      const result = await pushNextCycle(groupId, allowUnpaid);
      if (!isMounted.current) return;
      
      if (result?.error) {
        setErrorStatus({
          message: result.error,
          code: result.code,
          details: result.details
        });
      } else {
        router.refresh();
      }
    });
  };

  const isLastRound = currentCycle >= totalMembers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {!errorStatus ? (
        <Button 
          onClick={() => handlePush(false)} 
          isLoading={isPending}
          disabled={isPending}
          variant="primary"
          style={{ width: '100%' }}
          rightIcon={<ArrowRight size={18} />}
        >
          {currentCycle === 0 ? 'Start Rotation' : `Start Round ${currentCycle + 1}`}
        </Button>
      ) : errorStatus.code === 'PENDING_PAYMENTS' ? (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '0.75rem', 
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', color: '#ef4444' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Blocker: Pending Payments</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                Only {errorStatus.details?.paidCount || 0}/{errorStatus.details?.memberCount || 0} members have paid for Round {currentCycle}. 
                Advancing now will mark these as unpaid history.
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
               size="sm"
               variant="secondary" 
               style={{ flex: 1, fontSize: '0.75rem' }}
               onClick={() => handlePush(true)}
               isLoading={isPending}
               disabled={isPending}
            >
              Force Rotation
            </Button>
            <Button 
               size="sm"
               variant="outline" 
               style={{ flex: 1, fontSize: '0.75rem' }}
               onClick={() => setErrorStatus(null)}
               disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem' }}>
          {errorStatus.message}
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => setErrorStatus(null)}
            style={{ marginLeft: '0.5rem' }}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
