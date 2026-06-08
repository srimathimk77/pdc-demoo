import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const voterId = searchParams.get("voterId")?.trim();

    const { data: pollsData, error: pollsError } = await supabase
      .from("polls")
      .select(`
        id,
        question,
        author,
        created_at,
        poll_options (
          id,
          option_text,
          poll_votes (count)
        )
      `)
      .order("created_at", { ascending: false });

    if (pollsError) throw new Error(pollsError.message);

    let userVotesMap: { [pollId: string]: string } = {};
    if (voterId) {
      const { data: votesData, error: votesError } = await supabase
        .from("poll_votes")
        .select("poll_id, option_id")
        .eq("voter_id", voterId);

      if (!votesError && votesData) {
        votesData.forEach((v) => {
          userVotesMap[v.poll_id] = v.option_id;
        });
      }
    }

    const formattedPolls = (pollsData ?? []).map((p) => {
      const options = (p.poll_options ?? []).map((o: any) => ({
        id: o.id,
        option_text: o.option_text,
        votes: o.poll_votes?.[0]?.count ?? 0,
      }));

      return {
        id: p.id,
        question: p.question,
        author: p.author,
        created_at: p.created_at,
        options,
      };
    });

    return Response.json({ polls: formattedPolls, userVotes: userVotesMap });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { question, options, author } = await req.json();

    if (!question || !question.trim()) {
      return Response.json({ error: "Poll question is required" }, { status: 400 });
    }

    if (!options || !Array.isArray(options) || options.filter(o => o.trim()).length < 2) {
      return Response.json({ error: "At least two options are required" }, { status: 400 });
    }

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        question: question.trim(),
        author: author?.trim() || "Anonymous",
      })
      .select()
      .single();

    if (pollError) throw new Error(pollError.message);

    const optionRows = options
      .map((opt: string) => opt.trim())
      .filter((opt) => opt !== "")
      .map((opt: string) => ({
        poll_id: poll.id,
        option_text: opt,
      }));

    const { data: insertedOptions, error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionRows)
      .select();

    if (optionsError) {
      await supabase.from("polls").delete().eq("id", poll.id);
      throw new Error(optionsError.message);
    }

    const completePoll = {
      ...poll,
      options: insertedOptions.map((o) => ({
        id: o.id,
        option_text: o.option_text,
        votes: 0,
      })),
    };

    return Response.json(completePoll);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
