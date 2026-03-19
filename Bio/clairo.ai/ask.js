export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Missing or invalid question." });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY; // ← Lives on Vercel, NEVER in frontend

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Server misconfiguration: API key not set." });
  }

  const systemPrompt = `You are Clairo.ai, categorized as Ig-Bio. You are a highly specialized Biology AI tutor.
Your goal is to answer questions clearly, structured from easy to hard, suitable for all students.

Rules:
1. Only answer questions related to Biology. If a question is not biology, politely state you only answer biology questions.
2. Structure your answers using:
   - **Simple Summary (Beginner)**: A quick, easy-to-understand overview.
   - **Detailed Explanation (Intermediate)**: A deeper dive into mechanisms and concepts.
   - **Advanced Insight (Expert)**: Technical details, specific terminology, or scientific context.
3. Be educational, encouraging, and accurate.`;

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question.trim() },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      return res.status(groqResponse.status).json({
        error: errorData.error?.message || "Groq API error.",
      });
    }

    const data = await groqResponse.json();
    const answer = data.choices?.[0]?.message?.content || "No response received.";

    return res.status(200).json({ answer });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
