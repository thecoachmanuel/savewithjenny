'use client'

import React from 'react';
import { jumpToCycle } from '@/lib/payout-actions';
import { Button } from '@/components/ui/Button';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface CycleJumpFormProps {
  groupId: string;
  currentCycle: number;
  totalCycles: number;
  status: string;
}

export function CycleJumpForm({ groupId, currentCycle, totalCycles, status }: CycleJumpFormProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [selectedCycle, setSelectedCycle] = React.useState(currentCycle || 1);

  async function handleJump() {
    if (selectedCycle === currentCycle) return;
    
    const confirmMsg = selectedCycle < currentCycle 
      ? `Are you sure you want to jump BACK to Round ${selectedCycle}? This will reset future rounds to 'Scheduled'.`
      : `Are you sure you want to jump to Round ${selectedCycle}? Skipped rounds will be marked as 'Completed'.`;

    if (!confirm(confirmMsg)) return;

    setIsUpdating(true);
    const result = await jumpToCycle(groupId, selectedCycle);
    setIsUpdating(false);

    if (!result.success) {
      alert(result.error || 'Failed to update round');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
          value={selectedCycle}
          onChange={(e) => setSelectedCycle(parseInt(e.target.value))}
          disabled={isUpdating || status === 'completed'}
          className="input"
          style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)' }}
        >
          {Array.from({ length: totalCycles }, (_, i) => i + 1).map(num => (
            <option key={num} value={num}>Round #{num}</option>
          ))}
        </select>
        
        <Button 
          onClick={handleJump} 
          isLoading={isUpdating}
          variant="secondary"
          style={{ padding: '0.5rem 1rem' }}
          disabled={status === 'completed'}
        >
          Jump
        </Button>

      </div>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Manually override the active thrift round.
      </p>
    </div>
  );
}
