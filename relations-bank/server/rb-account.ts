import { createClient } from 'npm:@supabase/supabase-js@2.95.0';

const origin = 'https://almohammdin.github.io';
const headers = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers});
const usernameOK = (value: string) => /^[a-z][a-z0-9_]{2,29}$/.test(value);
const clean = (v: unknown, max = 320) => String(v ?? '').trim().slice(0, max);
async function digest(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
    .map(v => v.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers});
  if (req.method !== 'POST') return reply({error:'method_not_allowed'}, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const secret = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default;
    const publishable = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}').default;
    if (!secret || !publishable) return reply({error:'unavailable'}, 503);
    const admin = createClient(url, secret, {auth:{persistSession:false,autoRefreshToken:false}});
    const client = createClient(url, publishable, {auth:{persistSession:false,autoRefreshToken:false}});
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    if (action === 'signin') {
      const identifier = clean(body.identifier).toLowerCase();
      const password = String(body.password || '');
      if (!identifier || !password || password.length > 256) return reply({error:'invalid_credentials'}, 400);
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      for (const bucket of ['ip:'+ip, 'id:'+identifier]) {
        const {data:allowed,error} = await admin.rpc('rb_allow_login', {p_bucket:await digest(secret+bucket)});
        if (error) return reply({error:'unavailable'}, 503);
        if (!allowed) return reply({error:'rate_limit'}, 429);
      }
      let email = identifier;
      if (!identifier.includes('@')) {
        const handle = await admin.from('rb_login_handles').select('user_id').eq('username',identifier).maybeSingle();
        if (handle.error) return reply({error:'unavailable'}, 503);
        const owner = handle.data ? await admin.auth.admin.getUserById(handle.data.user_id) : null;
        email = owner?.data?.user?.email || 'missing-account@accounts.relations-bank.invalid';
      }
      const result = await client.auth.signInWithPassword({email,password});
      if (result.error || !result.data.session) return reply({error:'invalid_credentials'}, 401);
      // Successful authentication clears failures for this account, while the IP limit remains in force.
      await admin.from('rb_login_limits').delete().eq('bucket',await digest(secret+'id:'+identifier));
      return reply({session:{access_token:result.data.session.access_token,refresh_token:result.data.session.refresh_token}});
    }
    // Account changes are authorized using the current user's validated token.
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i,'') || '';
    const checked = await admin.auth.getUser(token);
    const user = checked.data?.user;
    if (checked.error || !user) return reply({error:'invalid_session'},401);
    const currentPassword = String(body.current_password || '');
    const verification = await client.auth.signInWithPassword({email:user.email!,password:currentPassword});
    if (verification.error) return reply({error:'current_password'},403);
    await client.auth.signOut({scope:'local'});
    if (action === 'profile') {
      const username = clean(body.username,30).toLowerCase();
      const email = clean(body.contact_email).toLowerCase();
      const name = clean(body.display_name,120);
      if (!usernameOK(username)) return reply({error:'username_format'},400);
      if (name.length < 2) return reply({error:'name'},400);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({error:'email'},400);
      const taken = await admin.from('rb_login_handles').select('user_id').eq('username',username).maybeSingle();
      if (taken.error) return reply({error:'unavailable'},503);
      if (taken.data && taken.data.user_id !== user.id) return reply({error:'username_taken'},409);
      const saved = await admin.from('rb_login_handles').upsert({user_id:user.id,username,contact_email:email,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if (saved.error) return reply({error:saved.error.code === '23505'?'username_taken':'unavailable'},409);
      const updated = await admin.auth.admin.updateUserById(user.id,{user_metadata:{display_name:name}});
      if (updated.error) return reply({error:'profile_partial'},500);
      const profile = await admin.from('rb_profiles').upsert({user_id:user.id,display_name:name},{onConflict:'user_id'});
      if (profile.error) return reply({error:'profile_partial'},500);
      return reply({ok:true,username,contact_email:email,display_name:name});
    }
    if (action === 'password') {
      const password = String(body.new_password || '');
      if (password.length < 12 || password.length > 256) return reply({error:'password_length'},400);
      const updated = await admin.auth.admin.updateUserById(user.id,{password});
      if (updated.error) return reply({error:'password_update'},400);
      return reply({ok:true});
    }
    return reply({error:'invalid_action'},400);
  } catch {
    return reply({error:'unavailable'},500);
  }
});
