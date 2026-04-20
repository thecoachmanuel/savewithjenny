'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const PaystackContributionButton = dynamic(
  () => import('@/components/payments/PaystackButton').then(mod => mod.PaystackContributionButton),
  { ssr: false }
);

interface MemberActionCenterProps {
  user: { id: string; email: string };
  group: { id: string; contribution_amount: number };
  activeCycle: { id: string } | null;
}

export function MemberActionCenter({ user, group, activeCycle }: MemberActionCenterProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PaystackContributionButton 
        email={user.email}
        amount={group.contribution_amount}
        metadata={{
          userId: user.id,
          groupId: group.id,
          type: 'contribution',
          cycleId: activeCycle?.id
        }}
      />
      <Link href="/dashboard/wallet" style={{ width: '100%' }}>
        <Button variant="secondary" style={{ width: '100%' }}>View Receipt History</Button>
      </Link>
    </div>
  );
}
