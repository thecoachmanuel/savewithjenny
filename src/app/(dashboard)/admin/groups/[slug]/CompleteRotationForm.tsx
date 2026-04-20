'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { completeRotation } from '@/lib/payout-actions';
import { useRouter } from 'next/navigation';

interface CompleteRotationFormProps {
  groupId: string;
}

export function CompleteRotationForm({ groupId }: CompleteRotationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeRotation(groupId);
      if (result?.success) {
        setShowConfirm(false);
        router.refresh();
      } else {
        alert(result?.error || "Failed to complete rotation.");
      }
    });
  };

  if (!showConfirm) {
    return (
      <Button 
        variant="primary" 
        style={{ width: '100%', background: 'var(--accent-primary)', color: 'white' }}
        leftIcon={<CheckCircle2 size={18} />}
        onClick={() => setShowConfirm(true)}
      >
        Finish Rotation
      </Button>
    );
  }

  return (
    <div style={{ 
      background: 'rgba(16, 185, 129, 0.1)', 
      border: '1px solid var(--accent-primary)', 
      borderRadius: '0.75rem', 
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--accent-primary)' }}>
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Finalize Rotation?</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
            This will mark the group as COMPLETED. No further payments can be made.
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button 
           size="sm"
           variant="primary" 
           style={{ flex: 2, fontSize: '0.75rem' }}
           onClick={handleComplete}
           isLoading={isPending}
           disabled={isPending}
        >
          Yes, Finish
        </Button>
        <Button 
           size="sm"
           variant="ghost" 
           style={{ flex: 1, fontSize: '0.75rem' }}
           onClick={() => setShowConfirm(false)}
           disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
