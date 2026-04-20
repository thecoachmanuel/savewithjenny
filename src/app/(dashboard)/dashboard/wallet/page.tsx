import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  History,
  TrendingUp,
  Filter
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*, groups(name)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_contributions, total_payouts_received')
    .eq('id', user?.id)
    .single();

  return (
    <div className="wallet-page">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Your <span className="text-gradient">Wallet</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track all your thrift contributions, payouts, and financial history.</p>
      </header>

      {/* Wallet Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <Card className="glass" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
            }}>
              <TrendingUp size={20} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL CONTRIBUTED</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatCurrency(profile?.total_contributions || 0)}</div>
        </Card>

        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
            }}>
              <ArrowDownLeft size={20} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL PAYOUTS</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{formatCurrency(profile?.total_payouts_received || 0)}</div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card title="Transaction Ledger" className="glass">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr 1fr 1fr', 
            padding: '1rem 0',
            borderBottom: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>Date</div>
            <div>Description</div>
            <div>Amount</div>
            <div style={{ textAlign: 'right' }}>Status</div>
          </div>

          {transactions?.map((tx) => (
            <div key={tx.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 2fr 1fr 1fr', 
              padding: '1.5rem 0',
              borderBottom: '1px solid var(--glass-border)',
              alignItems: 'center',
              fontSize: '0.875rem'
            }}>
              <div style={{ color: 'var(--text-secondary)' }}>
                {formatDate(tx.created_at)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: tx.type === 'credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: tx.type === 'credit' ? 'var(--accent-primary)' : 'var(--danger)'
                }}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{tx.category.replace('_', ' ').toUpperCase()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.groups?.name || 'Save with Jenny Platform'}</div>
                </div>
              </div>
              <div style={{ 
                fontWeight: 700, 
                color: tx.type === 'credit' ? 'var(--accent-primary)' : 'var(--text-primary)' 
              }}>
                {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="badge badge-success">Completed</div>
              </div>
            </div>
          ))}

          {(!transactions || transactions.length === 0) && (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <History size={48} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
              <p>No transactions recorded yet.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
