// import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabaseFolder/server";

// import { supabase } from "@/lib/supabase";
function getStartFromTimeRange(timeRange: string | null) {
  const now = new Date();
  const start = new Date(0);
  switch (timeRange) {
    case "1week": {
      const d = new Date(now);
      d.setDate(now.getDate() - 7);
      return d.toISOString();
    }
    case "2weeks": {
      const d = new Date(now);
      d.setDate(now.getDate() - 14);
      return d.toISOString();
    }
    case "1month": {
      const d = new Date(now);
      d.setMonth(now.getMonth() - 1);
      return d.toISOString();
    }
    case "all":
    default:
      return start.toISOString();
  }
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("timeRange");
    const userId = searchParams.get("userId"); // bigint in schema, string here is OK for filters

    let query = supabase
      .from("Tasks")
      .select(
        "id, title, description, assigned_by, assigned_to, status, due_date, created_at, priority, completed_at"
      )
      .order("created_at", { ascending: false });

    const startISO = getStartFromTimeRange(timeRange);
    if (timeRange && timeRange !== "all") {
      query = query.gte("created_at", startISO);
    }
    if (userId && userId !== "all") {
      // Filter tasks where user is assignee or assigner
      query = query.or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ tasks: data ?? [] });
  } catch (err: any) {
    const message =
      err?.message ||
      "Failed to load tasks. Ensure Supabase URL/Key environment variables are set.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
