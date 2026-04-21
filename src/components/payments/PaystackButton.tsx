'use client'

import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/Button';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { verifyAndProcessPayment } from '@/lib/payment-actions';
import { useRouter } from 'next/navigation';

interface PaystackContributionButtonProps {
  email: string;
  amount: number;
  metadata: {
    userId: string;
    groupId: string;
    type: 'contribution';
    cycleId?: string;
  };
  onSuccess?: (reference: any) => void;
  onClose?: () => void;
}

export function PaystackContributionButton({
  email,
  amount,
  metadata,
  onSuccess,
  onClose
}: PaystackContributionButtonProps) {
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const config = React.useMemo(() => ({
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: Math.round(amount * 100),
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    metadata: {
      ...metadata,
      custom_fields: []
    } as any,
  }), [email, amount, metadata]);

  const initializePayment = usePaystackPayment(config);

  const handleSuccess = async (reference: any) => {
    if (!isMounted.current) return;
    setIsVerifying(true);
    try {
      const result = await verifyAndProcessPayment(reference.reference);
      if (isMounted.current) {
        if (result.success) {
          setIsSuccess(true);
          router.refresh();
        } else {
          alert('Payment verification failed. Please contact support if you were debited.');
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      if (isMounted.current) {
        setIsVerifying(false);
      }
      if (onSuccess) onSuccess(reference);
    }
  };

  const handleClose = () => {
    if (onClose && isMounted.current) onClose();
  };

  if (isSuccess) {
    return (
      <Button disabled style={{ width: '100%', background: 'var(--accent-primary)', color: '#000' }}>
        <CheckCircle2 size={18} style={{ marginRight: '0.75rem' }} />
        Contribution Paid
      </Button>
    );
  }

  return (
    <Button 
      onClick={() => initializePayment({ onSuccess: handleSuccess, onClose: handleClose })}
      leftIcon={isVerifying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
      style={{ width: '100%' }}
      disabled={isVerifying}
    >
      {isVerifying ? 'Verifying Payment...' : 'Pay Contribution'}
    </Button>
  );
}
