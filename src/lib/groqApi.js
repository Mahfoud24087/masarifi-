/**
 * True Generative AI Engine for Masarifi
 * Powered by high-speed Groq LLMs with automatic model fallback & rate-limit resilience
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Models in priority order: ultra-fast lightweight models first to prevent token limit saturation
const GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];

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

  // Format financial snapshot with notes and custom category
  const topExpenses = expenses
    .slice(0, 15)
    .map(e => `- ${e.title}: ${e.amount} MRU (${e.custom_category || e.category}, ${e.date}${e.notes ? ` - Note: "${e.notes}"` : ''})`)
    .join('\n');

  const systemPrompt = `You are "Mustasharak / مستشارك المالي", the friendly personal AI coach in the Masarifi (مصاريفي) expense tracker application.

App & Developer Knowledge:
- App Name: Masarifi (مصاريفي)
- Creator: Mahfoud (محفوظ), built in 2026.
- Version: v2.3.0 True AI Edition
- How to change Password: Tap the Gear icon (⚙️ Settings / الإعدادات) in the bottom navigation bar -> tap "Change Password / تغيير كلمة المرور" -> enter current password and new password -> tap Save.
- How to change Mode (Dark / Light Theme): In Settings (⚙️ الإعدادات), look for "Dark Mode / الوضع الليلي" toggle switch and tap it to toggle between light and dark instantly.
- How to change Language: In Settings (⚙️ الإعدادات), under "Language / اللغة", choose between 🇲🇷 العربية, 🇫🇷 Français, or 🇬🇧 English.
- How to reduce spending: Suggest batching purchases, setting category limits, reducing repeated snacks/eating out, and tracking daily thresholds.

User Financial Snapshot:
- User Name: ${user?.name || 'محفوظ خيري'}
- Currency: Mauritanian Ouguiya (MRU / أوقية)
- Total Income: ${totalIncome} MRU
- Total Expenses: ${totalExpenses} MRU
- Net Balance: ${netBalance} MRU
- Recent Expenses:
${topExpenses || 'No expenses recorded yet.'}

Rules for Responses:
1. Always respond in the EXACT language used by the user. If asked "the langue" or "How i change...", answer concisely in that language.
2. Keep answers concise, clear, and direct (2 to 4 bullet points or short paragraphs).
3. Be conversational, empathetic, and intelligent: remember previous questions in the conversation.`;

  // Build message sequence (limit history to last 6 messages to stay well under token limits)
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const m of conversationHistory.slice(-6)) {
    messages.push({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    });
  }

  messages.push({
    role: 'user',
    content: prompt,
  });

  // Try models with automatic fallback on rate-limits
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: 350,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return { success: true, text: content.trim() };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`Groq model ${model} rate-limited or error:`, errJson.error?.message);
        // Continue to next model in list
      }
    } catch (err) {
      console.warn(`Network error trying model ${model}:`, err);
    }
  }

  return { success: false, error: 'RATE_LIMIT_OR_UNAVAILABLE' };
}
