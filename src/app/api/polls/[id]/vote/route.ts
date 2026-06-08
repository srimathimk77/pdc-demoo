import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const { voterId, optionId } = await req.json();

    if (!voterId || !optionId) {
      return Response.json({ error: "voterId and optionId are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("poll_votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        voter_id: voterId,
      });

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "You have already voted in this poll." }, { status: 409 });
      }
      throw new Error(error.message);
    }

    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
