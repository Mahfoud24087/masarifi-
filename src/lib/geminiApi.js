/**
 * Gemini AI Engine for Masarifi
 * Connects directly to Google's Gemini 1.5 Flash API with local fallback
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function askGemini({
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
  // If no API key provided, signal to caller to use fallback or ask user
  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'NO_API_KEY' };
  }

  // Format financial snapshot for Gemini
  const topExpenses = expenses
    .slice(0, 10)
    .map(e => `- ${e.title}: ${e.amount} MRU (${e.category}, ${e.date})`)
    .join('\n');

  const systemInstruction = `You are "Mustasharak / مستشارك المالي" (Financial Advisor), an intelligent, friendly AI embedded in the Masarifi (مصاريفي) personal expense tracker application.
App Details:
- App Name: Masarifi (مصاريفي)
- Version: v2.2.0 Gemini AI Edition
- Creator / Developer: Mahfoud (محفوظ), created in 2026.
- Purpose: Help users master personal budgeting, track expenses in Mauritanian Ouguiya (MRU / أوقية), and save money.

User Profile & Real-Time Financial Snapshot:
- User Name: ${user?.name || 'User'}
- Currency: Mauritanian Ouguiya (MRU / أوقية)
- Total Monthly Income: ${totalIncome} MRU
- Total Monthly Expenses: ${totalExpenses} MRU
- Net Balance: ${netBalance} MRU
- Recent Expenses:
${topExpenses || 'No expenses recorded yet.'}

Rules for Your Responses:
1. Speak in the language the user addresses you in (Arabic, French, or English). If the user asks you to switch languages (e.g. "تكلم بالانجليزية", "speak French"), switch immediately and respond in that language.
2. Be CONCISE, targeted, and natural. Answer specifically what the user asked without dumping unrelated blocks of data.
3. If asked about the creator, state clearly that Mahfoud (محفوظ) created Masarifi in 2026.
4. If asked about savings or spending, offer smart, practical, actionable tips based on their actual numbers.
5. You are an adaptive AI: understand slang, typos, and natural phrasing.`;

  // Build message history
  const contents = [];

  // Add system instruction as preamble
  contents.push({
    role: 'user',
    parts: [{ text: systemInstruction }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: "Understood. I am Mustasharak (مستشارك المالي), developed by Mahfoud in 2026. I am ready to advise the user concisely and accurately in their preferred language." }]
  });

  // Recent chat context (up to last 6 messages)
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  // Current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errData);
      return { success: false, error: errData.error?.message || 'API_REQUEST_FAILED' };
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return { success: true, text: candidateText.trim() };
    }

    return { success: false, error: 'NO_RESPONSE_TEXT' };
  } catch (error) {
    console.error('Network error calling Gemini:', error);
    return { success: false, error: error.message || 'NETWORK_ERROR' };
  }
}
