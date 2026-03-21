import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { toZonedTime } from "date-fns-tz";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Initialise inside handler so env vars are available at runtime (not build time)
  webpush.setVapidDetails(
    "mailto:admin@habitrise.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // Validate cron secret (Vercel passes it as Authorization header)
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const israelTime = toZonedTime(new Date(), "Asia/Jerusalem");
  const currentHour = israelTime.getHours();

  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("user_id, subscription, reminder_hour")
    .eq("reminder_hour", currentHour);

  if (error) return NextResponse.json({ error: error.message, currentHour }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0, currentHour, debug: "no subscriptions matched this hour" });

  const today = new Date().toISOString().split("T")[0];
  const userIds = subs.map((s) => s.user_id);

  const { data: completedToday } = await supabaseAdmin
    .from("habit_logs")
    .select("user_id")
    .in("user_id", userIds)
    .gte("completed_at", `${today}T00:00:00.000Z`);

  const completedSet = new Set((completedToday || []).map((r) => r.user_id));
  const pending = subs.filter((s) => !completedSet.has(s.user_id));
  const completed = subs.filter((s) => completedSet.has(s.user_id));

  const pendingMessages = [
    { title: "הגיבור שלך מחכה לך 🔥", body: "אל תשבור את הסטריק!" },
    { title: "יום אחד לא מספיק לשנות הרות ⚡", body: "תסמן עכשיו" },
    { title: "💪 עוד יום אחד ואתה מנצח", body: "אל תחמיץ את זה" },
  ];

  let sent = 0;
  await Promise.allSettled([
    ...completed.map(async (s) => {
      try {
        await webpush.sendNotification(
          s.subscription,
          JSON.stringify({
            title: "כל הכבוד! 🏆",
            body: "סימנת את ההרגל היום — הגיבור שלך גאה בך!",
          })
        );
        sent++;
      } catch {
        await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", s.user_id);
      }
    }),
    ...pending.map(async (s) => {
      const msg = pendingMessages[Math.floor(Math.random() * pendingMessages.length)];
      try {
        await webpush.sendNotification(
          s.subscription,
          JSON.stringify({ title: msg.title, body: msg.body })
        );
        sent++;
      } catch {
        await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", s.user_id);
      }
    }),
  ]);

  return NextResponse.json({ sent, total: subs.length, completed: completed.length, pending: pending.length, currentHour });
}
