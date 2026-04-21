import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Users, 
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default async function MemberGroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch groups the user is ALREADY IN
  const { data: myMemberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user?.id);

  const myGroupIds = myMemberships?.map(m => m.group_id) || [];

  const { data: myGroups } = myGroupIds.length > 0 
    ? await supabase.from('groups').select('*').in('id', myGroupIds)
    : { data: [] };

  // 2. Fetch AVAILABLE groups (not joined, not full, active)
  const { data: availableGroups } = await supabase
    .from('groups')
    .select('*')
    .eq('status', 'active')
    .not('id', 'in', `(${myGroupIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
    .order('created_at', { ascending: false });

  return (
    <div className="member-groups-page">
      <header style={{ marginBottom: '2.5rem' }} className="header-flex">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Thrift <span className="text-gradient">Groups</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Explore available thrift circles or manage your active savings.</p>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="stats-grid" style={{ marginBottom: '3rem' }}>
        <Card className="glass" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Your Active Groups</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{myGroups?.length || 0}</div>
            </div>
            <div style={{ color: 'var(--accent-primary)', opacity: 0.3 }}>
              <TrendingUp size={48} />
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Available Circles</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{availableGroups?.length || 0}</div>
            </div>
            <div style={{ color: 'var(--accent-gold)', opacity: 0.3 }}>
              <Users size={48} />
            </div>
          </div>
        </Card>
      </div>

      {/* My Groups Section */}
      {myGroups && myGroups.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>My Active <span className="text-gradient">Savings</span></h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          </div>
          
          <div className="stats-grid">
            {myGroups.map((group) => (
              <GroupCard key={group.id} group={group} isJoined />
            ))}
          </div>
        </section>
      )}

      {/* Available Groups Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Explore <span className="text-gradient">Circles</span></h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <Button variant="ghost" style={{ padding: '0.5rem' }}><Search size={18} /></Button>
             <Button variant="ghost" style={{ padding: '0.5rem' }}><Filter size={18} /></Button>
          </div>
        </div>

        <div className="stats-grid">
          {availableGroups?.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}

          {(!availableGroups || availableGroups.length === 0) && (
            <div style={{ 
              gridColumn: '1 / -1', 
              padding: '4rem', 
              textAlign: 'center', 
              background: 'var(--bg-secondary)', 
              borderRadius: '1rem',
              border: '2px dashed var(--glass-border)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>No new groups available at the moment. Check back later!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function GroupCard({ group, isJoined }: { group: any, isJoined?: boolean }) {
  return (
    <Card className="glass" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {isJoined && (
        <div style={{ 
          position: 'absolute', top: '1rem', right: '1rem',
        }} className="badge badge-success">Joined</div>
      )}
      
      <div style={{ 
        width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)',
        marginBottom: '1.5rem'
      }}>
        <Users size={24} />
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{group.name}</h3>
      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '0.875rem', 
        marginBottom: '1.5rem',
        height: '2.5rem',
        overflow: 'hidden'
      }}>{group.description}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONTRIBUTION</div>
          <div style={{ fontWeight: 600 }}>{formatCurrency(group.contribution_amount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FREQUENCY</div>
          <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{group.frequency}</div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
          <span style={{ fontWeight: 600 }}>{group.current_members} / {group.max_members}</span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            background: 'var(--accent-primary)', 
            width: `${(group.current_members / group.max_members) * 100}%` 
          }}></div>
        </div>
      </div>

      <Link href={`/dashboard/groups/${group.slug}`}>
        <Button variant={isJoined ? 'secondary' : 'primary'} style={{ width: '100%' }}>
          {isJoined ? 'Manage Savings' : 'View Group'} <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
        </Button>
      </Link>
    </Card>
  );
}
