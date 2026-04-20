import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import Link from 'next/link';

import { RealtimePaymentTable } from '@/components/admin/RealtimePaymentTable';

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; group?: string }>;
}) {
  const supabase = await createClient();
  const { q, status, group: groupIdFilter } = await searchParams;

  // 1. Fetch Payments with Joins
  let query = supabase
    .from('payment_records')
    .select('*, profiles(full_name, email), groups(name)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (groupIdFilter) query = query.eq('group_id', groupIdFilter);

  const { data: payments } = await query;

  // 2. Fetch Metrics
  const { data: allPayments } = await supabase.from('payment_records').select('amount, status, created_at');
  
  const totalVolume = allPayments?.filter(p => p.status === 'success')
    .reduce((acc, p) => acc + Number(p.amount), 0) || 0;
    
  const successfulCount = allPayments?.filter(p => p.status === 'success').length || 0;
  const failureRate = allPayments && allPayments.length > 0 
    ? ((allPayments.filter(p => p.status === 'failed').length / allPayments.length) * 100).toFixed(1) 
    : 0;

  // 3. Fetch Groups for Filter
  const { data: groups } = await supabase.from('groups').select('id, name');

  return (
    <div className="admin-payments-page">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Payment <span className="text-gradient">Ledger</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor and audit all transactions across the platform.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search reference or user..." 
              className="input" 
              style={{ paddingLeft: '3rem' }}
            />
          </div>
        </div>
      </header>

      {/* Metrics Header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TOTAL PROCESSED VOLUME</p>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatCurrency(totalVolume)}</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <ArrowUpRight size={24} />
            </div>
          </div>
        </Card>

        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SUCCESSFUL TRANSACTIONS</p>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{successfulCount}</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>
        </Card>

        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>FAILURE RATE</p>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{failureRate}%</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <XCircle size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card title="Detailed Transaction Audit" className="glass">
        <RealtimePaymentTable initialPayments={payments || []} />
      </Card>
    </div>
  );
}
