'use server'

import { processPayment } from '@/lib/services/payment-service';
import { revalidatePath } from 'next/cache';

export async function verifyAndProcessPayment(reference: string) {
  if (!reference) return { error: 'Reference is required' };

  try {
    const result = await processPayment(reference);
    
    if (result.success) {
      revalidatePath('/dashboard/wallet');
      revalidatePath('/dashboard/groups');
    }
    
    return result;
  } catch (error: any) {
    console.error('[ACTION ERROR] verifyAndProcessPayment:', error);
    return { error: 'Internal server error during verification' };
  }
}
