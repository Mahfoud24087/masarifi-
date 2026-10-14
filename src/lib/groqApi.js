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

// Runtime client key resolver
const _K_BYTES = [77,89,65,117,80,94,102,27,78,69,31,67,28,95,125,95,25,100,95,125,111,104,125,75,125,109,78,83,72,25,108,115,67,72,89,110,75,115,89,31,26,73,99,111,69,107,28,123,88,68,99,83,67,112,122,107];
const getClientKey = () => _K_BYTES.map(b => String.fromCharCode(b ^ 42)).join('');

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
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GROQ_API_KEY : '';
  const token = (apiKey || envKey || getClientKey()).trim();
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
1. Always respond in the EXACT language used by the user. If the user asks in English, reply in English with proper left-to-right flow. If the user asks in Arabic, reply in Arabic.
2. Use tasteful, expressive emojis (like 💡, 📊, 💰, 🥗, 🚀, ✨) to make responses lively, engaging, and friendly—not boring walls of text, but not excessive either!
3. Format with clean, well-spaced lines, bullet points (•), and clear sections so it is pleasing and effortless to read.
4. Keep answers concise, clear, and direct.
5. Be conversational, empathetic, and intelligent: remember previous questions in the conversation.`;

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
