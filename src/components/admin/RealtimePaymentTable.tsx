'use client'

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface RealtimePaymentTableProps {
  initialPayments: any[];
}

export function RealtimePaymentTable({ initialPayments }: RealtimePaymentTableProps) {
  const [payments, setPayments] = useState(initialPayments);
  const supabase = createClient();

  useEffect(() => {
    // 1. Set up the subscription
    const channel = supabase
      .channel('admin_payments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'payment_records'
        },
        async (payload) => {
          console.log('Realtime update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // For inserts, we need to fetch the joined data (profile name, group name)
            // since the payload only contains the raw record
            const { data: newPayment } = await supabase
              .from('payment_records')
              .select('*, profiles(full_name, email), groups(name)')
              .eq('id', payload.new.id)
              .single();
            
            if (newPayment) {
              setPayments(prev => [newPayment, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // For updates, we can just update the existing record
            // but we might need to re-fetch if names changed (unlikely in this context)
            setPayments(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
          } else if (payload.eventType === 'DELETE') {
            setPayments(prev => prev.filter(p => p.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Table Header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr 1fr 0.5fr', 
        padding: '1rem 0',
        borderBottom: '1px solid var(--glass-border)',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <div>Member</div>
        <div>Group</div>
        <div>Amount</div>
        <div>Reference</div>
        <div>Status</div>
        <div></div>
      </div>

      {/* Table Body */}
      {payments?.map((payment) => (
        <div key={payment.id} style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr 1fr 0.5fr', 
          padding: '1.25rem 0',
          borderBottom: '1px solid var(--glass-border)',
          alignItems: 'center',
          fontSize: '0.875rem',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{payment.profiles?.full_name || 'Loading...'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.profiles?.email}</span>
          </div>
          
          <div style={{ color: 'var(--text-secondary)' }}>
            {payment.groups?.name || 'N/A'}
          </div>

          <div style={{ fontWeight: 700 }}>
            {formatCurrency(payment.amount)}
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {payment.paystack_reference}
          </div>

          <div>
            <StatusBadge status={payment.status} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link href={`/admin/payments/${payment.id}`} className="btn-ghost" style={{ padding: '0.5rem' }}>
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      ))}

      {(!payments || payments.length === 0) && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <CreditCard size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
          <p>No payment records found.</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', icon: CheckCircle2 },
    pending: { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-gold)', icon: Clock },
    failed: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', icon: XCircle },
  };

  const style = styles[status] || styles.pending;
  const Icon = style.icon;

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '0.4rem', 
      padding: '0.25rem 0.75rem', 
      background: style.bg, 
      color: style.color,
      borderRadius: '2rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'capitalize'
    }}>
      <Icon size={14} />
      {status}
    </div>
  );
}
