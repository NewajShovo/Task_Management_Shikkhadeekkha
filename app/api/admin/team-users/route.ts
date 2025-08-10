import { getSupabaseServer } from "@/lib/supabaseFolder/server";

// PUT /api/admin/team-users
// Body: { userId: number, teamIds: string[] }
// Behavior: Replaces all Team_users rows for the user with the provided teamIds.
export async function PUT(req: Request) {
  try {
    const supabase = getSupabaseServer();

    const body = await req.json().catch(() => ({}));
    const userId = Number(body.userId);
    const teamIds: string[] = Array.isArray(body.teamIds) ? body.teamIds : [];

    if (!userId || Number.isNaN(userId)) {
      return Response.json(
        { error: "Valid userId is required" },
        { status: 400 }
      );
    }

    // Remove all current memberships for user
    const { error: delError } = await supabase
      .from("Team_users")
      .delete()
      .eq("user_id", userId);
    if (delError) {
      return Response.json({ error: delError.message }, { status: 500 });
    }

    // Insert new memberships (if any)
    if (teamIds.length > 0) {
      const rows = teamIds.map((team_id) => ({ team_id, user_id: userId }));
      const { error: insError } = await supabase
        .from("Team_users")
        .insert(rows);
      if (insError) {
        return Response.json({ error: insError.message }, { status: 500 });
      }
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    const message = err?.message || "Failed to update team memberships.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
