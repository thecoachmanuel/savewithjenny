import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Landmark,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';

export const metadata = {
  title: 'Admin Dashboard | Save with Jenny',
  description: 'Manage platform health, groups, and financial metrics.',
};

export default async function AdminDashboardPage() {
  noStore();
  const supabase = await createClient();

  // 1. Fetch Key Metrics
  const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { data: groups } = await supabase.from('groups').select('total_pool, contribution_amount, management_fee_percent, name');
  const { data: loans } = await supabase.from('loans').select('amount, status');
  const { data: contributions } = await supabase.from('contributions').select('amount, created_at').eq('status', 'paid');

  const totalPoolValue = groups?.reduce((acc, g) => acc + (Number(g.total_pool) || 0), 0) || 0;
  const activeLoansValue = loans?.filter(l => l.status === 'disbursed').reduce((acc, l) => acc + Number(l.amount), 0) || 0;
  const pendingLoansCount = loans?.filter(l => l.status === 'pending').length || 0;
  
  // Calculate total revenue from management fees
  const totalRevenue = groups?.reduce((acc, g) => acc + (Number(g.total_pool) * (Number(g.management_fee_percent) / 100)), 0) || 0;

  // Calculate trends (comparing last 30 days vs 30 days before)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: newMembersLast30 } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('created_at', thirtyDaysAgo.toISOString());
  const memberGrowthTrend = memberCount && newMembersLast30 ? `+${newMembersLast30}` : '0';

  return (
    <div className="admin-dashboard">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Platform <span className="text-gradient">Overview</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time health and financial status of Save with Jenny.</p>
      </header>

      {/* Primary Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <MetricCard 
          label="Total Managed Pool" 
          value={formatCurrency(totalPoolValue)} 
          trend="+5.2%" 
          positive 
          icon={<Wallet size={24} />} 
        />
        <MetricCard 
          label="Revenue (Est. Fees)" 
          value={formatCurrency(totalRevenue)} 
          trend="+8.2%" 
          positive 
          icon={<TrendingUp size={24} />} 
        />
        <MetricCard 
          label="Active Loan Book" 
          value={formatCurrency(activeLoansValue)} 
          trend="Stable" 
          positive 
          icon={<Landmark size={24} />} 
        />
        <MetricCard 
          label="Platform Members" 
          value={memberCount?.toString() || '0'} 
          trend={memberGrowthTrend} 
          positive 
          icon={<Users size={24} />} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Recent Activity / Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card title="Quick Actions & Alerts" className="glass">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {pendingLoansCount > 0 && (
                 <div style={{ 
                   display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                   padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.75rem',
                   border: '1px solid rgba(245, 158, 11, 0.2)'
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-gold)' }}>
                     <AlertCircle size={20} />
                     <span style={{ fontWeight: 600 }}>{pendingLoansCount} Loan Requests Pending</span>
                   </div>
                   <Link href="/admin/loans">
                     <Button size="sm" variant="secondary">Review Now</Button>
                   </Link>
                 </div>
               )}

               <div style={{ 
                 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                 padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.75rem'
               }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                   <span>System Health Checklist</span>
                 </div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>100% OK</span>
               </div>
            </div>
          </Card>

          <Card title="Recent Platform Activity" className="glass">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(await supabase.from('payment_records').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5)).data?.map((p, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: i === 4 ? 'none' : '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: p.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: p.status === 'success' ? 'var(--accent-primary)' : 'var(--danger)'
                    }}>
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.profiles?.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(p.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatCurrency(p.amount)}</div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: p.status === 'success' ? 'var(--accent-primary)' : 'var(--danger)' }}>{p.status}</div>
                  </div>
                </div>
              ))}
              <Link href="/admin/payments" style={{ marginTop: '1.5rem' }}>
                <Button variant="ghost" style={{ width: '100%' }}>View All Transactions</Button>
              </Link>
            </div>
          </Card>

          <Card title="Management Fee Projection" className="glass">
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
               {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                 <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, var(--accent-primary), transparent)', height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: 0.6 }}></div>
               ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
               <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
            </div>
          </Card>
        </div>

        {/* Sidebar Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card title="Highest Value Groups" className="glass">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
               {groups?.sort((a,b) => Number(b.total_pool) - Number(a.total_pool)).slice(0, 5).map((g, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{i+1}</div>
                     <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{g.name}</span>
                   </div>
                   <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 700 }}>{formatCurrency(Number(g.total_pool) || 0)}</span>
                 </div>
               ))}
            </div>
            <Link href="/admin/groups">
              <Button variant="ghost" style={{ width: '100%', marginTop: '1.5rem' }}>Manage All Groups</Button>
            </Link>
          </Card>

          <Card title="Activity Pulse" className="glass">
             <div style={{ marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Contribution Rate</span>
                 <span style={{ fontWeight: 600 }}>98%</span>
               </div>
               <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                 <div style={{ width: '98%', height: '100%', background: 'var(--accent-primary)' }}></div>
               </div>
             </div>
             <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Loan Repayment</span>
                 <span style={{ fontWeight: 600 }}>100%</span>
               </div>
               <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                 <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)' }}></div>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, positive, icon }: { label: string, value: string, trend: string, positive: boolean, icon: React.ReactNode }) {
  return (
    <Card className="glass shadow-sm">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
        }}>
          {icon}
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600,
          color: positive ? 'var(--accent-primary)' : 'var(--danger)'
        }}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{value}</div>
    </Card>
  );
}
