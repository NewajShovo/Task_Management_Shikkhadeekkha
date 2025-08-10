import { getSupabaseServer } from "@/lib/supabaseFolder/server";

type TeamRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  created_by: number | null;
};

type TeamUserRow = {
  team_id: string;
  user_id: number;
};

// GET /api/admin/teams
// Returns teams with aggregated members: number[]
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const [
      { data: teams, error: teamsError },
      { data: links, error: linksError },
    ] = await Promise.all([
      supabase
        .from("Teams")
        .select("id, name, description, created_at, created_by")
        .order("created_at", { ascending: false }),
      supabase.from("Team_users").select("team_id, user_id"),
    ]);

    if (teamsError) throw teamsError;
    if (linksError) throw linksError;

    const membersByTeam = new Map<string, number[]>();
    (links ?? []).forEach((l: TeamUserRow) => {
      const arr = membersByTeam.get(l.team_id) || [];
      arr.push(l.user_id);
      membersByTeam.set(l.team_id, arr);
    });

    const enriched = (teams ?? []).map((t: TeamRow) => ({
      ...t,
      members: membersByTeam.get(t.id) ?? [],
    }));

    return Response.json({ teams: enriched });
  } catch (err: any) {
    const message =
      err?.message ||
      "Failed to load teams. Ensure Supabase URL/Key environment variables are set.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// POST /api/admin/teams
// Body: { name: string, description?: string | null }
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const description =
      body?.description === null
        ? null
        : String(body?.description || "").trim() || null;

    if (!name) {
      return Response.json({ error: "Team name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Teams")
      .insert({ name, description })
      .select("id, name, description, created_at, created_by")
      .single();

    if (error) throw error;

    return Response.json({ team: { ...data, members: [] } });
  } catch (err: any) {
    const message = err?.message || "Failed to create team.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
