'use client'

import React from 'react';
import { updateMemberPosition } from '@/lib/group-actions';
import { Check } from 'lucide-react';

interface MemberPositionFormProps {
  groupId: string;
  userId: string;
  currentPosition: number;
  maxMembers: number;
}

export function MemberPositionForm({ groupId, userId, currentPosition, maxMembers }: MemberPositionFormProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  async function handlePositionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPos = parseInt(e.target.value);
    if (newPos === currentPosition) return;

    setIsUpdating(true);
    const result = await updateMemberPosition(groupId, userId, newPos);
    setIsUpdating(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      alert(result.error || 'Failed to update position');
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <select
        defaultValue={currentPosition}
        disabled={isUpdating}
        onChange={handlePositionChange}
        className="input"
        style={{ 
          padding: '0.25rem 0.5rem', 
          fontSize: '0.875rem', 
          width: '70px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: success ? 'var(--accent-primary)' : 'var(--glass-border)'
        }}
      >
        {Array.from({ length: maxMembers }, (_, i) => i + 1).map(num => (
          <option key={num} value={num}>#{num}</option>
        ))}
      </select>
      {success && <Check size={14} color="var(--accent-primary)" />}
    </div>
  );
}
