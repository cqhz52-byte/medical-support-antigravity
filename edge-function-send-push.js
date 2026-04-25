// =====================================================
// Supabase Edge Function: send-push
// 收到 Database Webhook 后，向目标工程师发送 Web Push 通知
//
// 部署步骤：
// 1. Supabase Dashboard → Edge Functions → 创建 send-push
// 2. 粘贴此代码 → Deploy
// 3. Edge Function Secrets 中设置：
//    VAPID_PUBLIC_KEY = BGdMnU3sHJwo5OTJ_sSVwRsTrJlbACvcRiURp0Tx4Z9oAdVAX4HG5qgIMbwyGxDOfRNDLuI4fMHZL8SIgMOMhl8
//    VAPID_PRIVATE_KEY = 5ktnkikRvIrMoRgrkElKJ5oJCStqn7SZrg2gC-bmuPc
// 4. Database Webhooks → dispatch_tasks INSERT → 触发此函数
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// 从环境变量读取 VAPID 密钥
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    "mailto:admin@curaway.com",
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

serve(async (req) => {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 解析 Database Webhook payload
    const webhookPayload = await req.json();
    const newTask = webhookPayload.record || webhookPayload;
    const engineerName = newTask.engineer_name;
    const hospital = newTask.target_hospital || "未知医院";
    const doctor = newTask.target_doctor || "待定";
    const surgery = newTask.procedure_type || "待定术式";

    if (!engineerName) {
      return new Response(JSON.stringify({ error: "No engineer_name in payload" }), { status: 400 });
    }

    // 查询目标工程师的推送订阅
    const { data: subs, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_name", engineerName);

    if (subError) {
      console.error("查询订阅失败:", subError);
      return new Response(JSON.stringify({ error: subError.message }), { status: 500 });
    }

    if (!subs || subs.length === 0) {
      console.log(`工程师 ${engineerName} 无推送订阅`);
      return new Response(JSON.stringify({ message: "No subscriptions found" }), { status: 200 });
    }

    // 构造推送消息
    const pushPayload = JSON.stringify({
      title: "🚨 新手术派单",
      body: `医院: ${hospital}\n医生: ${doctor}\n术式: ${surgery}`
    });

    // 使用 web-push 库发送加密推送
    const results = [];
    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        const result = await webpush.sendNotification(pushSubscription, pushPayload);
        results.push({ endpoint: sub.endpoint, status: result.statusCode });
        console.log(`推送成功: ${engineerName} (${result.statusCode})`);
      } catch (pushErr) {
        console.error(`推送失败: ${sub.endpoint}`, pushErr.statusCode, pushErr.body);
        results.push({ endpoint: sub.endpoint, error: pushErr.statusCode || pushErr.message });

        // 410 Gone = 订阅已失效，清理掉
        if (pushErr.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          console.log("已清理失效订阅:", sub.endpoint);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, count: subs.length, results }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Edge Function 异常:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
