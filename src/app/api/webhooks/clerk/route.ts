import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { encrypt, getLastThreeDigits } from '@/lib/encryption';

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
  try {
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
      
    // Assign super_admin if username matches allowed admin usernames (from env var)
    const adminUsernames = (process.env.ADMIN_USERNAMES || 'superadmin,admin').split(',').map(s => s.trim().toLowerCase());
    const userRole = adminUsernames.includes(username?.toLowerCase() || '') ? 'super_admin' : 'student';

      // 1. Check if the user is pre-registered by the coordinator
      const { data: preReg } = await supabase
        .from('pre_registered_students')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      // 2. Decide profile data
      let profileCompleted = false;
      let finalFullName = fullName;
      let nationalId = null;
      let nationalIdLast3 = null;
      let phone = null;
      let educationLevel = null;

      if (preReg) {
        profileCompleted = true;
        finalFullName = preReg.full_name || fullName;
        
        if (preReg.national_id_encrypted) {
          nationalId = preReg.national_id_encrypted;
        } else if (preReg.national_id) {
          nationalId = encrypt(preReg.national_id);
        }
        
        nationalIdLast3 = preReg.national_id_last3 || (preReg.national_id ? preReg.national_id.slice(-3) : null);
        
        phone = preReg.phone;
        educationLevel = preReg.education_level;
      }

      const { error } = await supabase.from('profiles').upsert({
        id,
        email,
        full_name: finalFullName,
        avatar_url: image_url || null,
        role: userRole,
        national_id_encrypted: nationalId,
        national_id_last3: nationalIdLast3 || null,
        phone: phone,
        education_level: educationLevel,
        profile_completed: profileCompleted,
      }, { onConflict: 'id' });

      if (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      // Sync role and profile_completed to Clerk publicMetadata for instant client-side access
      try {
        const client = await clerkClient();
        await client.users.updateUser(id, {
          publicMetadata: { role: userRole, profileCompleted },
        });
      } catch (metaErr) {
        console.error('Failed to update Clerk publicMetadata:', metaErr);
      }
    } else if (evt.type === 'user.updated') {
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
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      // Sync publicMetadata from Supabase (handles role changes made via admin panel)
      try {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('role, profile_completed')
          .eq('id', id)
          .single();

        if (currentProfile) {
          const client = await clerkClient();
          await client.users.updateUser(id, {
            publicMetadata: {
              role: currentProfile.role,
              profileCompleted: currentProfile.profile_completed,
            },
          });
        }
      } catch (metaErr) {
        console.error('Failed to sync Clerk publicMetadata:', metaErr);
      }
    } else if (evt.type === 'user.deleted') {
      // Clean up: applications, opportunities, notifications, and profile are handled
      // by the database on CASCADE, but we log it
      console.log('User deleted event received:', evt.data.id);
    } else {
      console.log('Unhandled webhook event type:', evt.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Unhandled webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
