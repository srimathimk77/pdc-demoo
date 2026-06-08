import { supabase } from "@/lib/supabase";
import { getQuestionsPage, searchQuestions } from "@/lib/questions";

const PAGE_SIZE = 10;

export function classifyQuestion(text: string): "What" | "Why" | "When" | "Where" | "Who" | "Which" | "Whose" | "How" {
  const lower = text.trim().toLowerCase();
  
  if (/^what\b/i.test(lower) || /\bwhat\b/i.test(lower)) return "What";
  if (/^why\b/i.test(lower) || /\bwhy\b/i.test(lower)) return "Why";
  if (/^when\b/i.test(lower) || /\bwhen\b/i.test(lower)) return "When";
  if (/^where\b/i.test(lower) || /\bwhere\b/i.test(lower)) return "Where";
  if (/^who\b/i.test(lower) || /\bwho\b/i.test(lower)) return "Who";
  if (/^which\b/i.test(lower) || /\bwhich\b/i.test(lower)) return "Which";
  if (/^whose\b/i.test(lower) || /\bwhose\b/i.test(lower)) return "Whose";
  if (/^how\b/i.test(lower) || /\bhow\b/i.test(lower)) return "How";

  // Fallbacks based on common auxiliary question starts
  if (/^(is|are|was|were|do|does|did|should|can|could|would|will|shall|has|have|had)\b/i.test(lower)) {
    if (/\b(time|date|day|year|schedule)\b/i.test(lower)) return "When";
    if (/\b(person|people|user|developer|admin|team)\b/i.test(lower)) return "Who";
    if (/\b(place|location|server|region|database|where)\b/i.test(lower)) return "Where";
    if (/\b(difference|compare|vs|or|choice)\b/i.test(lower)) return "Which";
    if (/\b(reason|cause|explain)\b/i.test(lower)) return "Why";
    if (/\b(method|way|guide|step|process|setup|deploy|run|prevent)\b/i.test(lower)) return "How";
    return "What";
  }

  return "What";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  if (q) {
    const questions = await searchQuestions(q, PAGE_SIZE, category);
    return Response.json({ questions, hasMore: false });
  }

  const offset = Number(searchParams.get("offset") ?? 0);
  const { questions, hasMore } = await getQuestionsPage(offset, PAGE_SIZE, category);
  return Response.json({ questions, hasMore });
}

export async function POST(req: Request) {
  try {
    const { body, author } = await req.json();

    if (!body || !body.trim()) {
      return Response.json({ error: "Question body is required" }, { status: 400 });
    }

    const category = classifyQuestion(body);

    const { data, error } = await supabase
      .from("questions")
      .insert({
        body: body.trim(),
        author: author?.trim() || "Anonymous",
        category,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
