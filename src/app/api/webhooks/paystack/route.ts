import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { processPayment } from '@/lib/services/payment-service';

export async function POST(req: Request) {
  const signature = req.headers.get('x-paystack-signature');
  
  if (!signature) {
    return NextResponse.json({ message: 'No signature' }, { status: 400 });
  }

  const bodyText = await req.text();
  
  // Verify Signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(bodyText)
    .digest('hex');

  if (hash !== signature) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(bodyText);
  
  if (event.event === 'charge.success') {
    const { reference } = event.data;
    const result = await processPayment(reference);
    
    if (!result.success) {
      console.error('[WEBHOOK ERROR] Failed to process payment:', result.error);
      return NextResponse.json({ message: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
