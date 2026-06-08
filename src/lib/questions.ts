import { supabase } from "@/lib/supabase";

export async function getQuestionsPage(offset: number, limit: number, category?: string) {
  let query = supabase
    .from("questions")
    .select("id, body, author, category, created_at, votes(count)");

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit); // inclusive → asks for limit + 1 rows

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((q) => ({
    id: q.id,
    body: q.body,
    author: q.author,
    category: q.category,
    votes: q.votes?.[0]?.count ?? 0,
  }));

  const hasMore = rows.length > limit; // got the extra row? there's a next page
  return { questions: rows.slice(0, limit), hasMore };
}

export async function searchQuestions(q: string, limit: number, category?: string) {
  let query = supabase
    .from("questions")
    .select("id, body, author, category, created_at, votes(count)");

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data, error } = await query
    .textSearch("body", q, { type: "websearch", config: "english" })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    author: row.author,
    category: row.category,
    votes: row.votes?.[0]?.count ?? 0,
  }));
}
