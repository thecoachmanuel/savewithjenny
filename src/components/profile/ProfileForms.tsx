'use client'

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { updateProfile } from '@/lib/profile-actions';
import { Loader2 } from 'lucide-react';

interface ProfileFormsProps {
  profile: any;
}

export function ProfileForms({ profile }: ProfileFormsProps) {
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, formId: string) => {
    e.preventDefault();
    setIsSubmitting(formId);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    setIsSubmitting(null);
    if (result.success) {
      setStatus({ type: 'success', message: 'Details updated successfully!' });
      // Auto hide success message
      setTimeout(() => setStatus(null), 5000);
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to update details.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {status && (
        <Alert 
          type={status.type} 
          message={status.message} 
          onClose={() => setStatus(null)} 
        />
      )}

      {/* Profile Information Form */}
      <Card 
        title="Profile Information" 
        subtitle="Your basic account details used across the platform."
        className="glass shadow-md"
      >
        <form onSubmit={(e) => handleSubmit(e, 'profile')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Full Name" 
              name="fullName" 
              defaultValue={profile?.full_name} 
              required 
            />
            <Input 
              label="Email Address" 
              name="email" 
              defaultValue={profile?.email} 
              disabled 
            />
          </div>
          <Input 
            label="Phone Number" 
            name="phone" 
            placeholder="+234..." 
            defaultValue={profile?.phone} 
          />
          
          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" disabled={isSubmitting === 'profile'}>
              {isSubmitting === 'profile' ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Banking Details Form */}
      <Card 
        title="Banking Details" 
        subtitle="Required for receiving your thrift payouts and loan disbursements."
        className="glass shadow-md"
      >
        <form onSubmit={(e) => handleSubmit(e, 'bank')}>
          <Input 
            label="Bank Name" 
            name="bankName" 
            placeholder="e.g. Zenith Bank" 
            defaultValue={profile?.bank_name} 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Account Number" 
              name="bankAccountNumber" 
              placeholder="0123456789" 
              defaultValue={profile?.bank_account_number} 
            />
            <Input 
              label="Account Name" 
              name="bankAccountName" 
              placeholder="John Doe" 
              defaultValue={profile?.bank_account_name} 
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" variant="secondary" disabled={isSubmitting === 'bank'}>
              {isSubmitting === 'bank' ? <Loader2 className="animate-spin" size={18} /> : 'Update Bank Info'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
