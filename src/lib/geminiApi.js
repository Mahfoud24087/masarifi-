const GEMINI_MODELS = [
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-1.5-flash',
];

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
  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'NO_API_KEY' };
  }

  const topExpenses = expenses
    .slice(0, 10)
    .map(e => `- ${e.title}: ${e.amount} MRU (${e.category}, ${e.date})`)
    .join('\n');

  const systemInstruction = `You are "Mustasharak / مستشارك المالي", the intelligent financial advisor in Masarifi (مصاريفي).
App: Masarifi (v2.2.0 AI Edition)
Creator: Mahfoud (محفوظ), created in 2026.
Currency: Mauritanian Ouguiya (MRU / أوقية).
User Name: ${user?.name || 'User'}
Total Income: ${totalIncome} MRU
Total Expenses: ${totalExpenses} MRU
Net Balance: ${netBalance} MRU
Recent Expenses:
${topExpenses || 'No expenses yet.'}

Rules:
1. Always respond in the language used by the user (Arabic, French, or English). If requested to switch language, switch immediately.
2. Be CONCISE and targeted. Only answer the exact question asked without dumping unrelated info.
3. If asked about the creator, state Mahfoud (محفوظ) created it in 2026.`;

  const contents = [
    { role: 'user', parts: [{ text: systemInstruction }] },
    { role: 'model', parts: [{ text: 'Understood. I am ready to advise concise and accurate answers.' }] }
  ];

  for (const msg of conversationHistory.slice(-4)) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return { success: true, text: candidateText.trim() };
        }
      }
    } catch (err) {
      console.warn(`Error trying ${model}:`, err);
    }
  }

  return { success: false, error: 'MODELS_UNAVAILABLE' };
}
