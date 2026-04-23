import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  Calendar, 
  Wallet, 
  Plus, 
  MoreVertical, 
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';

export default async function AdminGroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="admin-groups-page">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Group <span className="text-gradient">Management</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create and manage your cooperative thrift groups.</p>
        </div>
        
        <Link href="/admin/groups/create">
          <Button leftIcon={<Plus size={18} />}>
            Create New Group
          </Button>
        </Link>
      </header>

      {/* Stats Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <Card className="glass flex-center" style={{ flexDirection: 'column', padding: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Groups</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{groups?.length || 0}</div>
        </Card>
        <Card className="glass flex-center" style={{ flexDirection: 'column', padding: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Members</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {groups?.reduce((acc, g) => acc + (g.current_members || 0), 0)}
          </div>
        </Card>
        <Card className="glass flex-center" style={{ flexDirection: 'column', padding: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Pool Value</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
             ₦{groups?.reduce((acc, g) => acc + (g.total_pool || 0), 0).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Group Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {groups?.map((group) => (
          <Card key={group.id} className="glass" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                }}>
                  <Users size={24} />
                </div>
                <div className={group.status === 'active' ? 'badge badge-success' : 'badge badge-warning'}>
                  {group.status}
                </div>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{group.name}</h3>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.875rem', 
                marginBottom: '1.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                height: '2.5rem'
              }}>
                {group.description || 'No description provided.'}
              </p>

              <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CONTRIBUTION</div>
                  <div style={{ fontWeight: 600 }}>₦{group.contribution_amount.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>FREQUENCY</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{group.frequency}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>MEMBERS</div>
                  <div style={{ fontWeight: 600 }}>{group.current_members} / {group.max_members}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>START DATE</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(group.start_date)}</div>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '1rem 1.5rem', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Link href={`/admin/groups/${group.slug}`} style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }} className="text-gradient hover:opacity-80">
                View Details <ArrowUpRight size={16} />
              </Link>
              <button className="btn-ghost" style={{ padding: '0.25rem' }}>
                <MoreVertical size={18} />
              </button>
            </div>
          </Card>
        ))}

        {(!groups || groups.length === 0) && (
          <div style={{ 
            gridColumn: '1 / -1', 
            padding: '4rem', 
            textAlign: 'center', 
            background: 'var(--bg-secondary)', 
            borderRadius: '1rem',
            border: '2px dashed var(--glass-border)'
          }}>
            <CirclePlus size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
            <h3>No groups created yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Start by creating your first thrift contribution group.</p>
            <Link href="/admin/groups/create">
              <Button variant="secondary">Create Group</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CirclePlus({ size, style }: { size?: number, style?: React.CSSProperties }) {
  return <Plus size={size} style={style} />;
}
