'use client'

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { addMemberManually } from '@/lib/group-actions';

interface AddMemberFormProps {
  groupId: string;
  allProfiles: Array<{ id: string; full_name: string; email: string }>;
}

export function AddMemberForm({ groupId, allProfiles }: AddMemberFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const result = await addMemberManually(groupId, email);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
      (e.target as HTMLFormElement).reset();
      
      // Refresh the page data after success
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Add Member Manually</h3>
      
      {error && (
        <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', justifyContent: 'flex-start', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', justifyContent: 'flex-start', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          User added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
        <select 
          name="email" 
          className="input flex-1"
          required
          defaultValue=""
          style={{ appearance: 'none' }}
        >
          <option value="" disabled>Select a user to add...</option>
          {allProfiles.map(profile => (
            <option key={profile.id} value={profile.email}>
              {profile.full_name} ({profile.email})
            </option>
          ))}
        </select>
        <Button type="submit" isLoading={isLoading} leftIcon={<UserPlus size={18} />}>
          Add
        </Button>
      </form>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
        Select a registered user from the platform to add them to this group.
      </p>
    </div>
  );
}
