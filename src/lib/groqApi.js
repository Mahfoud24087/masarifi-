/**
 * True Generative AI Engine for Masarifi
 * Powered by high-speed Groq LLM (openai/gpt-oss-120b)
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export async function askGroqAI({
  prompt,
  apiKey,
  expenses = [],
  totalExpenses = 0,
  totalIncome = 0,
  netBalance = 0,
  budgets = {},
  user = null,
  lang = 'ar',
  conversationHistory = [],
}) {
  const token = (apiKey || import.meta.env.VITE_GROQ_API_KEY || '').trim();
  if (!token) {
    return { success: false, error: 'NO_API_KEY' };
  }

  // Format financial snapshot
  const topExpenses = expenses
    .slice(0, 10)
    .map(e => `- ${e.title}: ${e.amount} MRU (${e.category}, ${e.date})`)
    .join('\n');

  const systemPrompt = `You are "Mustasharak / مستشارك المالي", the intelligent AI financial coach embedded in the Masarifi (مصاريفي) personal expense tracker application.

Key Application Information:
- App Name: Masarifi (مصاريفي)
- Version: v2.3.0 True AI Edition
- Developer / Creator: Mahfoud (محفوظ), created in 2026.
- Purpose: Help users master personal budgeting, track expenses in Mauritanian Ouguiya (MRU / أوقية), and save money efficiently.

Current User Profile & Financial Snapshot:
- User Name: ${user?.name || 'User'}
- Currency: Mauritanian Ouguiya (MRU / أوقية)
- Total Monthly Income: ${totalIncome} MRU
- Total Monthly Expenses: ${totalExpenses} MRU
- Net Balance: ${netBalance} MRU
- Recent Expenses:
${topExpenses || 'No expenses recorded yet.'}

Instructions:
1. Always respond in the EXACT language the user speaks to you (Arabic, French, or English). If the user asks you to switch language (e.g. "parle en français", "speak in english", "تكلم بالعربية"), switch immediately and confirm warmly in that language.
2. Be CONCISE, natural, accurate, and helpful. Do not dump large walls of unnecessary text unless the user specifically asks for a detailed plan.
3. If asked who created/built/developed the app, state clearly that it was developed by Mahfoud (محفوظ) in 2026.
4. You are a real Generative AI: you can answer any general financial questions, explain budgeting strategies, answer questions about the app, or converse naturally.`;

  // Build message sequence
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Include recent conversation context (last 8 messages)
  for (const m of conversationHistory.slice(-8)) {
    messages.push({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    });
  }

  // Append current prompt
  messages.push({
    role: 'user',
    content: prompt,
  });

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 450,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('Groq API Error:', errJson);
      return { success: false, error: errJson.error?.message || 'REQUEST_FAILED' };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) {
      return { success: true, text: content.trim() };
    }

    return { success: false, error: 'EMPTY_RESPONSE' };
  } catch (err) {
    console.error('Network error calling Groq:', err);
    return { success: false, error: err.message };
  }
}
