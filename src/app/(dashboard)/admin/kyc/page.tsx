import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BadgeCheck, 
  XCircle, 
  FileText, 
  Search, 
  ExternalLink, 
  AlertCircle,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { verifyUserKYC } from '@/lib/admin-actions';
import { formatDate } from '@/lib/utils/formatDate';
import Link from 'next/link';

export default async function AdminKYCPage() {
  const supabase = await createClient();

  // 1. Fetch users with KYC documents, ordered by pending first
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .not('kyc_document_url', 'is', null)
    .order('kyc_verified', { ascending: true })
    .order('updated_at', { ascending: false });

  const pendingCount = users?.filter(u => !u.kyc_verified).length || 0;
  const verifiedCount = users?.filter(u => u.kyc_verified).length || 0;

  // 2. Generate Signed URLs for private kyc-documents bucket
  let usersWithSignedUrls = users || [];
  if (users && users.length > 0) {
    const paths = users
      .filter(u => u.kyc_document_url)
      .map(u => {
        // Handle both full URLs and relative paths
        if (u.kyc_document_url.includes('kyc-documents/')) {
          const parts = u.kyc_document_url.split('kyc-documents/');
          return parts[parts.length - 1];
        }
        return u.kyc_document_url;
      })
      .filter(p => p !== null) as string[];

    if (paths.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrls(paths, 3600); // 1 hour validity

      // Map signed URLs back to users
      usersWithSignedUrls = users.map(user => {
        if (!user.kyc_document_url) return user;
        
        let path = user.kyc_document_url;
        if (user.kyc_document_url.includes('kyc-documents/')) {
          const parts = user.kyc_document_url.split('kyc-documents/');
          path = parts[parts.length - 1];
        }
        
        const signedUrlObj = signedUrls?.find(s => s.path === path);
        return {
          ...user,
          signed_url: signedUrlObj?.signedUrl || user.kyc_document_url
        };
      });
    }
  }

  return (
    <div className="admin-kyc-page">
      <header className="header-flex" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Identity <span className="text-gradient">Verification</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and verify user identity documents to ensure platform safety.</p>
        </div>
      </header>

      {/* Metrics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <Card className="glass" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{pendingCount}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending Verifications</div>
            </div>
          </div>
        </Card>
        <Card className="glass" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <BadgeCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{verifiedCount}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Verified Members</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Verification Queue */}
      <Card title="Verification Queue" className="glass">
        <div className="table-wrapper">
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '700px' }}>
            {/* Table Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', 
              padding: '1rem 0',
              borderBottom: '1px solid var(--glass-border)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Member</div>
              <div>Submission Date</div>
              <div>Document</div>
              <div>Status</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Table Body */}
            {usersWithSignedUrls?.map((usr) => (
              <div key={usr.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', 
                padding: '1.25rem 0',
                borderBottom: '1px solid var(--glass-border)',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={16} color="var(--text-secondary)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{usr.full_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{usr.email}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {formatDate(usr.updated_at)}
                </div>

                <div>
                  {usr.kyc_document_url ? (
                    <a href={usr.signed_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                      <FileText size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>View ID</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No ID</span>
                  )}
                </div>

                <div>
                  {usr.kyc_verified ? (
                    <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      <BadgeCheck size={14} /> Verified
                    </div>
                  ) : (
                    <div style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Clock size={14} /> Pending
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  {!usr.kyc_verified ? (
                    <form action={verifyUserKYC.bind(null, usr.id, true) as any}>
                      <Button size="sm" style={{ padding: '0.5rem 1rem' }}>Verify</Button>
                    </form>
                  ) : (
                    <form action={verifyUserKYC.bind(null, usr.id, false) as any}>
                      <Button size="sm" variant="secondary" style={{ padding: '0.5rem 1rem', color: 'var(--danger)' }}>Revoke</Button>
                    </form>
                  )}
                </div>
              </div>
            ))}

            {(!users || users.length === 0) && (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
                <p>No verification requests found.</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
