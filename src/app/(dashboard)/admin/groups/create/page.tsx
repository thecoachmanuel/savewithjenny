'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, Info, HelpCircle } from 'lucide-react';
import { createGroup } from '@/lib/group-actions';

export default function CreateGroupPage() {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="create-group-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href="/admin/groups" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }} className="hover:text-white">
          <ChevronLeft size={16} /> Back to Groups
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Create <span className="text-gradient">New Group</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure the rules and schedule for your new thrift circle.</p>
      </header>

      <form action={createGroup as any} onSubmit={() => setIsLoading(true)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Basic Info */}
          <Card title="Basic Information" subtitle="General details about the group." className="glass">
            <Input 
              label="Group Name" 
              name="name" 
              placeholder="e.g. Wednesday Savings Squad" 
              required 
            />
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Description</label>
              <textarea 
                name="description"
                className="input"
                style={{ minHeight: '100px', resize: 'vertical' }}
                placeholder="What is the goal of this group?"
              ></textarea>
            </div>
          </Card>

          {/* Financial Rules */}
          <Card title="Financial Configuration" subtitle="Define the contribution and fee structure." className="glass">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Input 
                label="Contribution Amount (₦)" 
                name="contributionAmount" 
                type="number" 
                placeholder="50000" 
                required 
              />
              <div className="input-group">
                <label className="label">Frequency</label>
                <select name="frequency" className="input" required>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Input 
                label="Max Members" 
                name="maxMembers" 
                type="number" 
                defaultValue="10" 
                required 
              />
              <Input 
                label="Management Fee (%)" 
                name="managementFee" 
                type="number" 
                step="0.1" 
                defaultValue="2.5" 
                required 
              />
            </div>

            <Input 
              label="Late Fee Amount (₦)" 
              name="lateFee" 
              type="number" 
              defaultValue="0" 
              required 
            />
          </Card>

          {/* Schedule */}
          <Card title="Schedule" subtitle="When does the first contribution cycle start?" className="glass">
            <Input 
              label="Start Date" 
              name="startDate" 
              type="date" 
              required 
              defaultValue={new Date().toISOString().split('T')[0]}
            />
            
            <div className="badge badge-warning" style={{ padding: '1rem', width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.875rem', textTransform: 'none', fontWeight: 400, color: 'inherit' }}>
                <strong>Note:</strong> Once created, you can invite members using a unique link. The rotation schedule will be generated once the group reaches full capacity or you manually start it.
              </p>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '4rem' }}>
            <Link href="/admin/groups">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Create Group
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
