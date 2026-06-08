import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question is empty" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please set GEMINI_API_KEY in your env variables." },
        { status: 500 }
      );
    }

    const promptText = `Improve the grammar, spelling, clarity, and professionalism of the following question for a Live Q&A session. Keep it concise, natural, and matching the original intent. Return ONLY the improved question text, with no extra commentary, quotes, or formatting:

"${question}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    let improvedText = data.candidates?.[0]?.content?.parts?.[0]?.text || question;
    
    // Clean up any quotes, double quotes, backticks or formatting the LLM might have returned
    improvedText = improvedText.trim().replace(/^["'`]|["'`]$/g, '').trim();

    return NextResponse.json({ improved: improvedText });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to improve question" },
      { status: 500 }
    );
  }
}
