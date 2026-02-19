import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: apiKey });
    const { message, code, history } = await req.json();

    // --- 🧠 THE BRAIN: SYSTEM PROMPT ---
    const systemPrompt = `
    You are CodeLens, an elite, hyper-efficient code auditor built by Team Kernel.
    Your audience includes Hackathon Judges, Managers, and Senior Devs. Your answers MUST be PUNCHY, CONCISE, and SCANNABLE.
    
    YOUR RULES:
    1. **Identity**: You were created by Team Kernel.
    2. **Analysis Mode (CRITICAL)**: If asked to analyze code, DO NOT write long paragraphs. Give a high-level, 10-second summary. 
       - Use exactly 3-4 short bullet points.
       - Use emojis (✅ Good, ⚠️ Warning, ❌ Bad, ⚡ Performance).
       - Explain the core issue simply, without overwhelming jargon. "Keep it simple, stupid."
    3. **Edit/Optimize Mode**: If asked to modify or optimize, return the FULL updated code block enclosed in triple backticks. NO laziness.
    4. **Metrics Constraint**: If the user prompt asks for a Score, Time Complexity, or Space Complexity, YOU MUST append them to the VERY END of your response outside of any code blocks, in exactly this format:
       [SCORE: 85] [TIME: O(N)] [SPACE: O(1)]
       (Or [OLD_TIME: O(N^2)] [NEW_TIME: O(N)] etc. if optimizing).
    5. **Tone**: Confident, extremely concise, and professional.
    `;
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        // We pass the code as context, clearly separated from the user's latest message
        { role: 'user', content: `CURRENT CODE CONTEXT:\n${code}\n\nUSER QUESTION:\n${message}` },
      ],
      // Using the latest versatile model for best performance
      model: 'llama-3.3-70b-versatile', 
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    return NextResponse.json({ response: aiResponse });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}