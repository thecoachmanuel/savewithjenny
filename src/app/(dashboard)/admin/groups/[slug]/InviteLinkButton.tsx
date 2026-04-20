'use client'

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Share2, Check } from 'lucide-react';

export function InviteLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    // Determine the base URL (handles local and production)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${baseUrl}/dashboard/groups/${slug}`;
    
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button 
      variant="secondary" 
      leftIcon={copied ? <Check size={18} /> : <Share2 size={18} />}
      onClick={copyToClipboard}
    >
      {copied ? 'Copied URL!' : 'Invite Link'}
    </Button>
  );
}
