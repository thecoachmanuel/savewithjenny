import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface AdminPaymentMatrixProps {
  groupId: string;
  totalPool: number;
  contributionAmount: number;
}

export async function AdminPaymentMatrix({ groupId, contributionAmount }: AdminPaymentMatrixProps) {
  const supabase = await createClient();

  // 1. Fetch all members and cycles
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(full_name)')
    .eq('group_id', groupId)
    .order('position', { ascending: true });

  const { data: cycles } = await supabase
    .from('group_cycles')
    .select('*')
    .eq('group_id', groupId)
    .order('cycle_number', { ascending: true });

  // 2. Fetch all payment sources for the group
  const { data: contribs } = await supabase
    .from('contributions')
    .select('user_id, cycle_id, status')
    .eq('group_id', groupId)
    .eq('status', 'paid');

  const { data: records } = await supabase
    .from('payment_records')
    .select('user_id, status, metadata')
    .eq('group_id', groupId)
    .eq('status', 'success');

  if (!members || !cycles) return null;

  // 3. Build the Payment Map
  const paymentMap = new Set<string>();

  // a. Process explicit contributions
  contribs?.forEach(c => {
    if (c.cycle_id) paymentMap.add(`${c.user_id}-${c.cycle_id}`);
  });

  // b. Process Payment Records with Metadata
  records?.forEach(r => {
    const meta = r.metadata as any;
    const cycleIdFromMeta = meta?.cycleId || (meta && typeof meta === 'object' && meta.metadata ? (meta.metadata as any).cycleId : null);
    if (cycleIdFromMeta) paymentMap.add(`${r.user_id}-${cycleIdFromMeta}`);
  });

  // c. Heuristic for Remaining "Orphan" Payments
  members.forEach(member => {
    const userContribs = (contribs || []).filter(c => c.user_id === member.user_id);
    const userRecords = (records || []).filter(r => r.user_id === member.user_id);
    const totalPaymentsFound = Math.max(userContribs.length, userRecords.length);
    
    let mappedCount = 0;
    cycles.forEach(c => {
      if (paymentMap.has(`${member.user_id}-${c.id}`)) mappedCount++;
    });

    let orphansToMap = Math.max(0, totalPaymentsFound - mappedCount);
    cycles.forEach(cycle => {
      if (orphansToMap > 0 && !paymentMap.has(`${member.user_id}-${cycle.id}`)) {
        paymentMap.add(`${member.user_id}-${cycle.id}`);
        orphansToMap--;
      }
    });
  });

  // 4. Calculate Column Metadata (Progress & Volume)
  // Ensure we show ALL rounds up to the expected max, even if some cycles are missing from DB
  const maxCycleNumber = Math.max(...(cycles.map(c => c.cycle_number) || [0]), members.length);
  const fullCycleRange = Array.from({ length: maxCycleNumber }, (_, i) => i + 1);

  const cycleStats = fullCycleRange.map(num => {
    const cycle = cycles.find(c => c.cycle_number === num);
    if (!cycle) {
      return { 
        id: `missing-${num}`, 
        cycle_number: num, 
        status: 'missing', 
        paidInCycle: 0, 
        progress: 0, 
        volume: 0 
      };
    }
    const paidInCycle = members.filter(m => paymentMap.has(`${m.user_id}-${cycle.id}`)).length;
    const totalInGroup = members.length;
    const progress = Math.round((paidInCycle / totalInGroup) * 100);
    const volume = paidInCycle * contributionAmount;
    return { ...cycle, paidInCycle, progress, volume };
  });

  return (
    <Card className="glass" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Financial <span className="text-gradient">Command Matrix</span></h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Real-time audit of contributions and liquidity across all rotation rounds.
            </p>
          </div>
          <div style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>LIVE AUDIT ACTIVE</span>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '1.25rem 1rem', textAlign: 'left', minWidth: '200px', borderBottom: '1px solid var(--glass-border)', position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 10 }}>Member</th>
              {cycleStats.map(cycle => (
                <th key={cycle.id} style={{ padding: '1.25rem 1rem', minWidth: '130px', textAlign: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.75rem', color: cycle.status === 'active' ? 'var(--accent-primary)' : 'inherit' }}>
                    ROUND {cycle.cycle_number}
                  </div>
                  {/* Round Progress Bar */}
                  <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', margin: '0.25rem auto', overflow: 'hidden' }}>
                    <div style={{ width: `${cycle.progress}%`, height: '100%', background: cycle.progress === 100 ? 'var(--accent-primary)' : 'var(--accent-secondary)' }} />
                  </div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                    {cycle.status}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.user_id} className="hover:bg-white/5 transition-colors">
                <td style={{ padding: '1rem', fontWeight: 700, position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 5, borderBottom: '1px solid var(--glass-border)' }}>
                  {Array.isArray(member.profiles) ? member.profiles[0]?.full_name : (member.profiles as any)?.full_name}
                </td>
                {cycleStats.map(cycle => {
                  const isPaid = cycle.id.toString().startsWith('missing') ? false : paymentMap.has(`${member.user_id}-${cycle.id}`);
                  const isPast = cycle.status === 'completed';
                  const isActive = cycle.status === 'active';
                  const isMissing = cycle.status === 'missing';
                  
                  let content;
                  let cellBg = 'transparent';

                  if (isMissing) {
                    content = (
                      <div style={{ color: 'var(--text-muted)', opacity: 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                        <AlertTriangle size={14} />
                        <span style={{ fontSize: '0.5rem' }}>NO DATA</span>
                      </div>
                    );
                  } else if (isPaid) {
                    content = (
                      <div style={{ color: 'var(--accent-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                        <CheckCircle2 size={18} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>PAID</span>
                      </div>
                    );
                  } else if (isPast) {
                    content = (
                      <div className="pulse-red" style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                        <XCircle size={18} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>MISSED</span>
                      </div>
                    );
                    cellBg = 'rgba(239, 68, 68, 0.05)';
                  } else if (isActive) {
                    content = (
                      <div style={{ color: '#3b82f6', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                        <AlertTriangle size={18} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>DUE</span>
                      </div>
                    );
                    cellBg = 'rgba(59, 130, 246, 0.03)';
                  } else {
                    content = (
                      <div style={{ color: 'var(--text-muted)', opacity: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                        <Clock size={16} />
                        <span style={{ fontSize: '0.6rem' }}>PENDING</span>
                      </div>
                    );
                  }

                  return (
                    <td key={cycle.id} style={{ padding: '1rem', textAlign: 'center', background: cellBg, borderBottom: '1px solid var(--glass-border)' }}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
              <td style={{ padding: '1.25rem 1rem', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-secondary)', position: 'sticky', left: 0, background: 'var(--bg-primary)' }}>ROUND VOLUME</td>
              {cycleStats.map(stat => (
                <td key={stat.id} style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 800, color: stat.progress === 100 ? 'var(--accent-primary)' : 'inherit' }}>
                  {formatCurrency(stat.volume)}
                  <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{stat.paidInCycle} Paid</div>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend Footnote */}
      <div style={{ padding: '1rem 1.5rem', background: 'rgba(255, 255, 255, 0.01)', borderTop: '2px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
            <span>Fulfilled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
            <span>Missed Alert</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
            <span>Active Collection</span>
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </Card>
  );
}
