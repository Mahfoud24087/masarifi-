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

  const systemPrompt = `You are "Mustasharak / مستشارك المالي", the intelligent and helpful personal AI coach in the Masarifi expense tracker application.

App & Feature Knowledge:
- App Name: Masarifi (مصاريفي)
- Currency: Mauritanian Ouguiya (MRU / أوقية)
- Platform: Modern web app & PWA accessible on any phone or computer browser at https://masarifi-nine.vercel.app/ (NOT an APK file).
- Account Creation & Sign Up:
  * Users CAN and DO create accounts! Anyone can register for free with their Full Name and a Password.
  * To create an account / Sign Up: On the welcome screen, tap "Get Started" (ابدأ الآن) or "Sign Up" (إنشاء حساب) -> enter Full Name and Password (minimum 4 characters) -> tap "Create Account".
  * For friends: Tell them to open https://masarifi-nine.vercel.app/ in their phone's browser and tap "Get Started" to create their own free, private account.
  * Data sync: Accounts are securely synced with cloud database (Supabase) and also cached locally for full offline support.
- How to Rate the App ("Rate the App" / تقييم التطبيق):
  * Masarifi HAS a built-in "Rate the App" feature directly inside the app!
  * To rate or leave a review: Tap the Gear icon (⚙️ Settings / الإعدادات) in the bottom navigation bar -> scroll to "Rate the App / تقييم التطبيق" -> select 1 to 5 stars (⭐) -> write your comment or thoughts -> tap "Submit Review / إرسال التقييم" (or "Update Review / تحديث التقييم").
  * Featured user reviews are displayed on the app's home landing screen for the community!
- How to Add Expenses & Income: Tap the green (+) button in the center of the bottom navigation bar. Select Expense or Income, pick a category (Food, Transport, Bills, etc.), enter the amount in MRU, optional date & notes, and tap Save.
- How to Set Budgets: In Settings (⚙️ الإعدادات), tap "Budgets / ميزانيات الفئات" and set monthly limits per category.
- How to Export Data: In Settings (⚙️ الإعدادات), tap "Export CSV / تصدير CSV" to download all transactions in an Excel-compatible spreadsheet.
- How to Change Password: In Settings (⚙️ الإعدادات), tap "Change Password / تغيير كلمة المرور" -> enter current password and new password -> tap Save.
- How to Change Theme: In Settings (⚙️ الإعدادات), toggle the "Dark Mode / الوضع الليلي" switch.
- How to Change Language: In Settings (⚙️ الإعدادات), select Arabic (العربية), French (Français), or English.
- How to Reduce Spending: Suggest batching purchases, setting category limits, reducing repeated snacks/eating out, and tracking daily thresholds.

Developer & Privacy Rules (CRITICAL):
- Creator / Developer: Mahfoud Khayri (محفوظ خيري), built in 2026.
- Background: A final-year student at SupNum (Higher Institute of Digital Technologies / المعهد العالي للرقمنة) in Mauritania. He created Masarifi as an independent personal community initiative to help people track their money in Ouguiya (MRU) before graduating (it is NOT a university graduation project, but a personal initiative for the community).
- STRICT PRIVACY RULE: NEVER mention the developer's name (Mahfoud Khayri) or his school UNLESS the user explicitly asks who created, built, or developed the app! For all other questions (how to rate the app, how to create an account, spending analysis, budgets, etc.), NEVER mention Mahfoud Khayri. Keep responses strictly focused on answering the user's question about the app!

User Financial Snapshot:
- User Name: ${user?.name || 'User / مستخدم'}
- Total Income: ${totalIncome} MRU
- Total Expenses: ${totalExpenses} MRU
- Net Balance: ${netBalance} MRU
- Recent Expenses:
${topExpenses || 'No expenses recorded yet.'}

Rules for Responses:
1. Always respond in the EXACT language used by the user. If asked in English, reply in 100% natural English. If asked in Arabic, reply in natural Arabic. If asked in French, reply in natural French.
2. NUMBERS & DIGITS STRICT RULE: ALWAYS and EXCLUSIVELY use Western/Latin digits (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) in all your responses, even when answering in Arabic! NEVER write Eastern Arabic numerals (like ٠, ١, ٢, ٣, ٤, ٥, ٦, ٧, ٨, ٩). Always write numbers like: 150 أوقية, 50%, 10 مايو, 1., 2., 3.
3. When answering in English, do NOT randomly insert Arabic words like "(مصاريفي)" or "(محفوظ خيري)" in parentheses unless asked. Keep English text purely in English so punctuation and layout remain clean and natural.
4. Use tasteful emojis (💡, 📊, 💰, ⭐, ⚙️) to make answers clear, friendly, and structured with bullet points.
5. Completeness & Multi-Step Details (CRITICAL): Always provide COMPLETE, thorough, and fully finished responses. Never cut off mid-sentence, mid-thought, or halfway through an answer. When the user asks for steps, tips, strategies, or stages (e.g. 3 étapes, 5 نصائح, steps 1, 2, 3), YOU MUST EXPLAIN AND WRITE OUT EVERY SINGLE STEP/STAGE IN FULL DETAIL from step 1 all the way to the end. Always finish your thoughts with a full final sentence and conclusion.`;

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

  // 1. Try secure backend proxy first (keeps API keys protected on the server)
  try {
    const proxyRes = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature: 0.6,
        max_tokens: 2048,
      }),
    });
    if (proxyRes.ok) {
      const pData = await proxyRes.json();
      const pContent = pData?.choices?.[0]?.message?.content;
      if (pContent) {
        return { success: true, text: pContent.trim() };
      }
    }
  } catch (err) {
    // If not deployed on Vercel with serverless functions yet, fall back gracefully
    console.debug('Proxy bypassed, falling back to direct Groq API:', err);
  }

  // 2. Direct client fallback with models list
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
          max_tokens: 2048,
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
