import { getSupabaseServer } from "@/lib/supabaseFolder/server";
// import { supabase } from "@/lib/supabase";

function getRangeForReport(timeRange: string | null) {
  const now = new Date();
  const start = new Date(0);
  const end = new Date();
  switch (timeRange) {
    case "today": {
      const s = new Date(now);
      s.setHours(0, 0, 0, 0);
      const e = new Date(now);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "yesterday": {
      const s = new Date(now);
      s.setDate(now.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "1week": {
      const s = new Date(now);
      s.setDate(now.getDate() - 7);
      return { start: s, end };
    }
    case "1month": {
      const s = new Date(now);
      s.setMonth(now.getMonth() - 1);
      return { start: s, end };
    }
    default:
      return { start, end };
  }
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("timeRange");
    const userId = searchParams.get("userId");

    const { start, end } = getRangeForReport(timeRange);

    let query = supabase
      .from("Daily_work_logs")
      .select("id, user_id, summary, work_items, created_at")
      .order("created_at", { ascending: false });

    if (userId && userId !== "all") {
      query = query.eq("user_id", userId);
    }
    query = query
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ reports: data ?? [] });
  } catch (err: any) {
    const message =
      err?.message ||
      "Failed to load daily reports. Ensure Supabase URL/Key environment variables are set.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
