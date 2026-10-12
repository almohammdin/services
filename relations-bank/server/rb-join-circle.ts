import {corsHeaders} from 'npm:@supabase/supabase-js@2.95.0/cors';

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  'Access-Control-Allow-Origin':'https://almohammdin.github.io',
  'Access-Control-Allow-Headers':corsHeaders['Access-Control-Allow-Headers'],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "authentication_required" }), { status: 401, headers: cors });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const publishableKey = publishableKeys.default;
    const secretKey = secretKeys.default;

    if (!publishableKey || !secretKey) throw new Error("project_keys_unavailable");

    const userClient = createClient(url, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const token = authHeader.slice(7);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "invalid_session" }), { status: 401, headers: cors });
    }

    const body = await req.json().catch(() => ({}));
    const inviteCode = String(body?.invite_code || "").trim();
    if (!/^[a-f0-9]{12}$/i.test(inviteCode)) {
      return new Response(JSON.stringify({ error: "invalid_invite_code" }), { status: 400, headers: cors });
    }

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: circle, error: circleError } = await admin
      .from("rb_circles")
      .select("id,active")
      .eq("invite_code", inviteCode)
      .eq("active", true)
      .maybeSingle();

    if (circleError) throw circleError;
    if (!circle) {
      return new Response(JSON.stringify({ error: "invite_not_found" }), { status: 404, headers: cors });
    }

    const { error: memberError } = await admin
      .from("rb_circle_members")
      .upsert(
        { circle_id: circle.id, user_id: user.id, role: "member" },
        { onConflict: "circle_id,user_id", ignoreDuplicates: true }
      );

    if (memberError) throw memberError;

    return new Response(JSON.stringify({ ok: true, circle_id: circle.id }), { status: 200, headers: cors });
  } catch (error) {
    console.error("rb-join-circle", error);
    return new Response(JSON.stringify({ error: "join_failed" }), { status: 500, headers: cors });
  }
});
