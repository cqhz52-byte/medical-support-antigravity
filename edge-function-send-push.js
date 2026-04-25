// =====================================================
// Supabase Edge Function: send-push
// 收到 Database Webhook 后，向目标工程师发送 Web Push 通知
// =====================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const webhookPayload = await req.json();
    const newTask = webhookPayload.record || webhookPayload;
    const engineerName = newTask.engineer_name;
    const hospital = newTask.target_hospital || "未知医院";
    const doctor = newTask.target_doctor || "待定";
    const surgery = newTask.procedure_type || "待定术式";

    if (!engineerName) {
      return new Response(JSON.stringify({ error: "No engineer_name" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_name", engineerName);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions" }), { status: 200 });
    }

    const pushPayload = JSON.stringify({
      title: "🚨 新手术派单",
      body: `医院: ${hospital}\n医生: ${doctor}\n术式: ${surgery}`
    });

    const results = [];
    for (const sub of subs) {
      try {
        const res = await fetch(sub.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", TTL: "86400", Urgency: "high" },
          body: pushPayload
        });
        results.push({ status: res.status });
        if (res.status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      } catch (e) {
        results.push({ error: e.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
