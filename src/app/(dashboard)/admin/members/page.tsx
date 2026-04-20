import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Landmark, 
  BadgeCheck, 
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q: query = '' } = await searchParams;

  // 1. Fetch all profiles, optionally filtered by name or email
  let membersQuery = supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (query) {
    membersQuery = membersQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data: members } = await membersQuery;

  return (
    <div className="admin-members-page">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Member <span className="text-gradient">Directory</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage all platform members and access payout details for disbursements.</p>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <Card className="glass" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <form method="GET" style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              name="q"
              defaultValue={query}
              placeholder="Search by name or email..." 
              className="input" 
              style={{ paddingLeft: '3rem', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
          {query && (
            <a href="/admin/members" className="btn btn-ghost">Clear</a>
          )}
        </form>
      </Card>

      <Card className="glass">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Member</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Contact</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>KYC Status</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Bank Details</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="hover:bg-white/5">
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={18} color="var(--text-secondary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{member.full_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                        <Mail size={12} color="var(--text-muted)" /> {member.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                        <Phone size={12} color="var(--text-muted)" /> {member.phone || 'No phone'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    {member.kyc_verified ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700 }}>
                        <BadgeCheck size={14} /> Verified
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 700 }}>
                        <AlertCircle size={14} /> Unverified
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    {member.bank_name ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{member.bank_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <code>{member.bank_account_number}</code>
                          <button 
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                navigator.clipboard.writeText(member.bank_account_number);
                                alert('Account number copied!');
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{member.bank_account_name}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No details provided</span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {formatDate(member.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!members || members.length === 0) && (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <p>No members found matching your search.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
