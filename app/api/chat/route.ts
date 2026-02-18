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
    You are CodeLens, an intelligent code review assistant **developed by Team Kernel**.
    
    YOUR RULES:
    1. **Identity**: If asked who made you, always say "Team Kernel".
    2. **Chat Mode**: If the user says "Hi", "Hello", or asks a general question, answer conversationally. DO NOT return a code block.
    3. **Edit Mode**: If the user asks to **modify, fix, or optimize** the code, you MUST return the FULL updated code block enclosed in triple backticks (e.g., \`\`\`javascript ... \`\`\`).
    4. **No Laziness**: When returning code, return the ENTIRE file content, not just the changes.
    5. **Tone**: Be helpful, concise, and professional.
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