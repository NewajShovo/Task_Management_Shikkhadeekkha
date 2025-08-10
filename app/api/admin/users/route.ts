import { getSupabaseServer } from "@/lib/supabaseFolder/server";
type DBUser = {
  id: number;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  email: string | null;
  status: "pending" | "approved" | "rejected" | string | null;
};

// GET /api/admin/users
export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("Users")
      .select("id, created_at, full_name, avatar_url, role, email, status")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ users: (data ?? []) as DBUser[] });
  } catch (err: any) {
    const message =
      err?.message ||
      "Failed to load users. Ensure Supabase URL/Key environment variables are set.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// PATCH /api/admin/users
// Body: { id: number, status: "pending" | "approved" | "rejected" }
export async function PATCH(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    const status = String(body?.status || "").toLowerCase();

    if (!id || Number.isNaN(id)) {
      return Response.json(
        { error: "Valid user id is required" },
        { status: 400 }
      );
    }
    const allowed = new Set(["pending", "approved", "rejected"]);
    if (!allowed.has(status)) {
      return Response.json(
        { error: "Invalid status. Use pending | approved | rejected" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("Users")
      .update({ status })
      .eq("id", id)
      .select("id, created_at, full_name, avatar_url, role, email, status")
      .single();

    if (error) throw error;
    return Response.json({ user: data as DBUser });
  } catch (err: any) {
    const message = err?.message || "Failed to update user status.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
