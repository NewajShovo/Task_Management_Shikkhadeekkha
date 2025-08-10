import { getSupabaseServer } from "@/lib/supabaseFolder/server";

type Params = { params: { id: string } }

// PATCH /api/admin/teams/[id]
// Body: { name?: string; description?: string | null }
export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = params.id
    if (!id) return Response.json({ error: "Missing team id" }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const updates: { name?: string; description?: string | null } = {}

    if (typeof body.name === "string") {
      const name = body.name.trim()
      if (!name) return Response.json({ error: "Team name cannot be empty" }, { status: 400 })
      updates.name = name
    }
    if (body.description === null) {
      updates.description = null
    } else if (typeof body.description === "string") {
      updates.description = body.description.trim() || null
    }

    if (!("name" in updates) && !("description" in updates)) {
      return Response.json({ error: "Nothing to update" }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    const { data: updated, error: updErr } = await supabase
      .from("Teams")
      .update(updates)
      .eq("id", id)
      .select("id, name, description, created_at, created_by")
      .single()

    if (updErr) return Response.json({ error: updErr.message }, { status: 500 })

    // Fetch members to keep the shape consistent with GET /api/admin/teams
    const { data: links, error: linksErr } = await supabase.from("Team_users").select("user_id").eq("team_id", id)

    if (linksErr) return Response.json({ error: linksErr.message }, { status: 500 })

    return Response.json({
      team: {
        ...updated,
        id: String(updated.id),
        members: (links || []).map((l) => l.user_id as number),
      },
    })
  } catch (err: any) {
    return Response.json({ error: err?.message || "Failed to update team" }, { status: 500 })
  }
}

// DELETE /api/admin/teams/[id]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = params.id
    if (!id) return Response.json({ error: "Missing team id" }, { status: 400 })

    const supabase = getSupabaseServer()

    // Best effort: clean membership rows first (safe even if FK CASCADE exists)
    const { error: delLinksErr } = await supabase.from("Team_users").delete().eq("team_id", id)
    if (delLinksErr) {
      // If there's a FK cascade it might fail due to permission; still try deleting team
      // but we'll log-style return message if team delete fails later
    }

    const { error: delTeamErr } = await supabase.from("Teams").delete().eq("id", id)
    if (delTeamErr) return Response.json({ error: delTeamErr.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err?.message || "Failed to delete team" }, { status: 500 })
  }
}
