import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

interface WebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    username?: string;
  };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;
    const email = email_addresses?.[0]?.email_address || '';
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || username || null;
    
    // Assign super_admin if username is exactly 'admin', 'super_admin', or 'superadmin'
    const allowedAdmins = ['admin', 'super_admin', 'superadmin'];
    const userRole = allowedAdmins.includes(username?.toLowerCase() || '') ? 'super_admin' : 'student';

    const { error } = await supabase.from('profiles').upsert({
      id,
      email,
      full_name: fullName,
      avatar_url: image_url || null,
      role: userRole,
      profile_completed: false,
    }, { onConflict: 'id' });

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address || '';
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

    const { error } = await supabase
      .from('profiles')
      .update({
        email,
        full_name: fullName,
        avatar_url: image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating profile:', error);
    }
  }

  return NextResponse.json({ received: true });
}
