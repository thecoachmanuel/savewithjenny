'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, Info, HelpCircle } from 'lucide-react';
import { updateGroup } from '@/lib/group-actions';
import { useRouter } from 'next/navigation';

export function EditGroupForm({ group }: { group: any }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    
    const result = await updateGroup(group.id, formData);
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(`/admin/groups/${group.slug}`);
      router.refresh();
    }
  }

  return (
    <div className="edit-group-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href={`/admin/groups/${group.slug}`} style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }} className="hover:text-white">
          <ChevronLeft size={16} /> Back to Group Details
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Edit <span className="text-gradient">Group</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Update the rules and configuration for {group.name}.</p>
      </header>

      {error && (
        <div className="badge badge-danger" style={{ width: '100%', padding: '1rem', marginBottom: '2rem', justifyContent: 'flex-start' }}>
          {error}
        </div>
      )}

      <form action={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Basic Info */}
          <Card title="Basic Information" subtitle="General details about the group." className="glass">
            <Input 
              label="Group Name" 
              name="name" 
              defaultValue={group.name}
              placeholder="e.g. Wednesday Savings Squad" 
              required 
            />
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Description</label>
              <textarea 
                name="description"
                className="input"
                defaultValue={group.description}
                style={{ minHeight: '100px', resize: 'vertical' }}
                placeholder="What is the goal of this group?"
              ></textarea>
            </div>
            <div style={{ marginBottom: '0' }}>
              <label className="label">Group Rules</label>
              <textarea 
                name="rules"
                className="input"
                defaultValue={group.rules}
                style={{ minHeight: '120px', resize: 'vertical' }}
                placeholder="List any specific rules for participants..."
              ></textarea>
            </div>
          </Card>

          {/* Financial Rules */}
          <Card title="Financial Configuration" subtitle="Define the contribution and fee structure." className="glass">
            <div className="form-grid">
              <Input 
                label="Contribution Amount (₦)" 
                name="contributionAmount" 
                type="number" 
                defaultValue={group.contribution_amount}
                placeholder="50000" 
                required 
              />
              <div className="input-group">
                <label className="label">Frequency</label>
                <select name="frequency" className="input" defaultValue={group.frequency} required>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <Input 
                label="Max Members" 
                name="maxMembers" 
                type="number" 
                defaultValue={group.max_members}
                required 
              />
              <Input 
                label="Management Fee (%)" 
                name="managementFee" 
                type="number" 
                step="0.1" 
                defaultValue={group.management_fee_percent}
                required 
              />
            </div>
            
            <Input 
              label="Late Fee Amount (₦)" 
              name="lateFee" 
              type="number" 
              defaultValue={group.late_fee_amount}
              required 
            />
          </Card>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '4rem' }}>
            <Link href={`/admin/groups/${group.slug}`}>
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
