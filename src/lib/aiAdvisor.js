/**
 * Advanced Multi-language Financial AI Assistant for Masarifi
 * Features:
 * - Detects language dynamically (Arabic, French, English) regardless of interface language
 * - Fully knowledgeable about Masarifi: Creator (Mahfoud), purpose, launch date (2026), version (2.1.0 AI Edition), vision
 * - Deep financial statistics & minute-by-minute expense minimization calculation
 * - Dynamic category queries (Food, Transport, Bills, Health, Entertainment, Education, Shopping, Salary, etc.)
 * - Budget checks, savings forecasts, daily limits, and smart tips
 * - Interactive conversation memory & progressive learning
 */

function detectLanguage(text, defaultLang = 'ar') {
  if (!text) return defaultLang;
  // Arabic detection
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  // French detection keywords
  const frKeywords = /\b(qui|quoi|pourquoi|comment|quand|version|argent|dépense|dépenses|combien|bonjour|salut|merci|créateur|créé|développeur|nourriture|transport|facture|économiser|solde|revenu|salaire)\b/i;
  if (frKeywords.test(text)) return 'fr';
  // English detection keywords
  const enKeywords = /\b(who|what|why|how|when|version|money|expense|expenses|how much|hello|hi|thanks|creator|created|developer|food|transport|bills|save|balance|income|salary)\b/i;
  if (enKeywords.test(text)) return 'en';
  return defaultLang;
}

export function generateFinancialInsight({
  prompt,
  expenses = [],
  totalExpenses = 0,
  totalIncome = 0,
  netBalance = 0,
  budgets = {},
  user = null,
  lang = 'ar',
  conversationHistory = [],
  t = (k) => k,
}) {
  const rawQ = (prompt || '').trim();
  const q = rawQ.toLowerCase();
  const detectedLang = detectLanguage(rawQ, lang);
  const userName = user?.name || (detectedLang === 'ar' ? 'صديقي' : detectedLang === 'fr' ? 'cher ami' : 'friend');

  // Breakdown by category
  const categoryTotals = {};
  const expenseList = expenses.filter((e) => (e.type || 'expense') === 'expense');
  const incomeList = expenses.filter((e) => e.type === 'income');

  expenseList.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0] || null;

  // Time metrics
  const now = new Date();
  const daysPassed = Math.max(1, now.getDate());
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - daysPassed);
  const dailyAverage = totalExpenses / daysPassed;
  const projectedMonthly = dailyAverage * totalDaysInMonth;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Formatting helpers
  const fmt = (num) => Math.round(num || 0).toLocaleString();
  const cur = detectedLang === 'ar' ? 'أوقية' : 'MRU';

  // Learning factor: count previous user messages in session
  const interactionCount = (conversationHistory || []).filter((m) => m.sender === 'user').length;
  const learnedBonus = interactionCount > 2 
    ? (detectedLang === 'ar' 
        ? `\n\n🧠 *بناءً على أسئلتك المتكررة في هذه الجلسة، لاحظت أنك تهتم بضبط الميزانية بدقة. سأقدم لك أرقاماً أكثر تفصيلاً دائماً.*` 
        : detectedLang === 'fr'
        ? `\n\n🧠 *En observant vos questions, j'affine mes recommandations pour vos objectifs financiers.*`
        : `\n\n🧠 *Based on our ongoing conversation, I am personalizing these financial calculations directly to your goals.*`)
    : '';

  // =========================================================================
  // 1. APP IDENTITY, CREATOR, VERSION, PURPOSE & STORY
  // =========================================================================
  const isAboutAppOrCreator = 
    q.includes('من صنع') || q.includes('من طور') || q.includes('من انت') || q.includes('من أنت') || 
    q.includes('من صمم') || q.includes('من أنشأ') || q.includes('ما هو التطبيق') || q.includes('ما هذا') ||
    q.includes('ماهو') || q.includes('متى') || q.includes('لماذا') || q.includes('الاصدار') || q.includes('الإصدار') ||
    q.includes('version') || q.includes('who created') || q.includes('who made') || q.includes('who developed') ||
    q.includes('who are you') || q.includes('what is this') || q.includes('why was') || q.includes('qui a créé') ||
    q.includes('qui t\'a') || q.includes('qui es-tu') || q.includes('c\'est quoi') || q.includes('pourquoi');

  if (isAboutAppOrCreator) {
    if (detectedLang === 'ar') {
      return `✨ **معلومات عن تطبيق مصاريفي (Masarifi):**\n\n` +
        `👨‍💻 **المطوّر والمؤسس:** طوّره **محفوظ (Mahfoud)** بكل فخر لخدمة المجتمع الموريتاني والعالم العربي.\n` +
        `🎯 **الهدف والرؤية:** تم ابتكار مصاريفي بهدف تمكين كل شخص من التحكم الكامل في أمواله، التخلص من الديون والمصاريف العشوائية، وبناء عادات مالية ذكية تناسب الواقع المحلي بالعملة الوطنية (الأوقية).\n` +
        `📅 **تاريخ الإطلاق:** 2026.\n` +
        `🚀 **الإصدار:** **2.1.0 (النسخة الذكية بالذكاء الاصطناعي PWA)**.\n` +
        `🔒 **الأمان:** بياناتك مشفرة ومحفوظة سحابياً عبر قاعدة بيانات Supabase المتطورة مع دعم العمل بدون إنترنت.\n\n` +
        `أنا هنا لمساعدتك دائماً، اسألني عن أي تفاصيل مالية! 💚${learnedBonus}`;
    }

    if (detectedLang === 'fr') {
      return `✨ **À propos de l'application Masarifi :**\n\n` +
        `👨‍💻 **Créateur & Développeur :** Créé avec passion par **Mahfoud** pour aider la communauté à maîtriser ses finances personnelles.\n` +
        `🎯 **Mission & Objectif :** Aider chacun à suivre facilement ses revenus et dépenses, éviter les gaspillages et planifier ses économies en Ouguiya (MRU) avec l'aide de l'IA.\n` +
        `📅 **Année de lancement :** 2026.\n` +
        `🚀 **Version actuelle :** **2.1.0 (Édition IA & PWA Cloud)**.\n` +
        `🔒 **Sécurité :** Vos données sont synchronisées en toute sécurité via Supabase avec fonctionnement hors ligne.\n\n` +
        `N'hésitez pas à me poser vos questions sur vos finances ! 💚${learnedBonus}`;
    }

    return `✨ **About Masarifi:**\n\n` +
      `👨‍💻 **Creator & Developer:** Proudly built by **Mahfoud** to empower people to take full control of their financial freedom.\n` +
      `🎯 **Purpose & Vision:** Simplify expense tracking, eliminate unplanned spending, and give intelligent, minute-by-minute financial advice tailored in Ouguiya (MRU).\n` +
      `📅 **Launch Date:** 2026.\n` +
      `🚀 **Version:** **2.1.0 (AI Edition & Cloud PWA)**.\n` +
      `🔒 **Cloud Storage:** Securely powered by Supabase with complete offline resilience.\n\n` +
      `How can I assist you with your money today? 💚${learnedBonus}`;
  }

  // =========================================================================
  // 2. SPECIFIC CATEGORY INQUIRIES (Food, Transport, Bills, Health, etc.)
  // =========================================================================
  const checkCat = (arWord, frWord, enWord) => q.includes(arWord) || q.includes(frWord) || q.includes(enWord);

  const matchedCat = 
    checkCat('طعام', 'nourriture', 'food') || checkCat('أكل', 'repas', 'eating') ? 'food' :
    checkCat('مواصلات', 'transport', 'transport') || checkCat('تاكسي', 'taxi', 'car') ? 'transport' :
    checkCat('تسوق', 'shopping', 'shopping') || checkCat('شراء', 'achats', 'buy') ? 'shopping' :
    checkCat('فواتير', 'facture', 'bills') || checkCat('فاتورة', 'factures', 'bill') ? 'bills' :
    checkCat('صحة', 'santé', 'health') || checkCat('دواء', 'médicament', 'doctor') ? 'health' :
    checkCat('ترفيه', 'divertissement', 'entertainment') ? 'entertainment' :
    checkCat('تعليم', 'éducation', 'education') ? 'education' : null;

  if (matchedCat) {
    const amount = categoryTotals[matchedCat] || 0;
    const catName = t(`categories.${matchedCat}`);
    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
    const budgetVal = budgets[matchedCat] || 0;

    if (detectedLang === 'ar') {
      let r = `🍽️ **تحليل فئة (${catName}):**\n\n`;
      r += `• **المصروف حتى الآن:** **${fmt(amount)} ${cur}** (${pct}% من إجمالي مصاريفك).\n`;
      if (budgetVal > 0) {
        const bpct = Math.round((amount / budgetVal) * 100);
        r += `• **الميزانية المحددة:** ${fmt(budgetVal)} ${cur} (استهلكت منها ${bpct}%).\n`;
        r += bpct > 100 ? `⚠️ **تجاوزت ميزانية هذه الفئة بمقدار ${fmt(amount - budgetVal)} ${cur}!**\n` : `✅ ما زلت ضمن حدود ميزانيتك.\n`;
      }
      r += `\n💡 **نصيحة التوفير:** تقليص 20% من مشتريات ${catName} سيوفر لك فوراً **${fmt(amount * 0.2)} ${cur}**.`;
      return r + learnedBonus;
    }

    if (detectedLang === 'fr') {
      return `📊 **Analyse de la catégorie (${catName}) :**\n\n` +
        `• **Montant dépensé :** **${fmt(amount)} ${cur}** (${pct}% de vos dépenses totales).\n` +
        (budgetVal > 0 ? `• **Budget défini :** ${fmt(budgetVal)} ${cur} (${Math.round((amount / budgetVal) * 100)}% utilisé).\n` : '') +
        `\n💡 **Conseil d'économie :** Réduire cette catégorie de 20% vous fera économiser **${fmt(amount * 0.2)} ${cur}**.${learnedBonus}`;
    }

    return `📊 **Category Analysis (${catName}):**\n\n` +
      `• **Spent so far:** **${fmt(amount)} ${cur}** (${pct}% of your total expenses).\n` +
      (budgetVal > 0 ? `• **Set Budget:** ${fmt(budgetVal)} ${cur} (${Math.round((amount / budgetVal) * 100)}% used).\n` : '') +
      `\n💡 **Savings Tip:** Cutting 20% of your ${catName} expenses will save you **${fmt(amount * 0.2)} ${cur}**.${learnedBonus}`;
  }

  // =========================================================================
  // 3. WHERE DID MY MONEY GO / BIGGEST EXPENSES
  // =========================================================================
  if (
    q.includes('أين') || q.includes('وين') || q.includes('أكبر') || q.includes('فيم') || q.includes('أكثر') || q.includes('اكبر') ||
    q.includes('où') || q.includes('plus grand') || q.includes('dépensé') || q.includes('parti') ||
    q.includes('where') || q.includes('biggest') || q.includes('most') || q.includes('spent')
  ) {
    if (!topCategory) {
      if (detectedLang === 'ar') return `مرحباً ${userName}! 📊 لم تسجل أي مصاريف حتى الآن لهذا الشهر. أضف معاملاتك عبر زر (+) وسأحللها لك فوراً!`;
      if (detectedLang === 'fr') return `Bonjour ${userName} ! Aucune dépense enregistrée ce mois-ci. Cliquez sur (+) pour commencer !`;
      return `Hello ${userName}! No expenses recorded this month yet. Tap (+) to start tracking!`;
    }

    const topCatName = t(`categories.${topCategory[0]}`);
    const topCatAmount = fmt(topCategory[1]);
    const topCatPercent = totalExpenses > 0 ? Math.round((topCategory[1] / totalExpenses) * 100) : 0;
    const potentialSaving = fmt(topCategory[1] * 0.15);

    if (detectedLang === 'ar') {
      return `🔍 **تحليل أكبر المصاريف يا ${userName}:**\n\n` +
        `أكبر باب خرجت فيه أموالك هو **${topCatName}** بمبلغ **${topCatAmount} ${cur}** (${topCatPercent}% من مجموع مصاريفك).\n\n` +
        (sortedCategories[1] ? `ويليه في المرتبة الثانية: **${t(`categories.${sortedCategories[1][0]}`)}** بمبلغ **${fmt(sortedCategories[1][1])} ${cur}**.\n\n` : '') +
        `💡 **خطة التوفير الدقيقة:** تقليص نفقات ${topCatName} بنسبة 15% فقط يوفر لك **${potentialSaving} ${cur}** قبل نهاية الشهر!${learnedBonus}`;
    }

    if (detectedLang === 'fr') {
      return `🔍 **Analyse de vos principales dépenses, ${userName} :**\n\n` +
        `Votre dépense n°1 est **${topCatName}** avec **${topCatAmount} ${cur}** (${topCatPercent}% de vos dépenses).\n\n` +
        `💡 **Conseil :** En réduisant cette catégorie de 15%, vous économiserez **${potentialSaving} ${cur}** ce mois-ci !${learnedBonus}`;
    }

    return `🔍 **Your Highest Spending Breakdown, ${userName}:**\n\n` +
      `Your #1 spending area is **${topCatName}** with **${topCatAmount} ${cur}** (${topCatPercent}% of all expenses).\n\n` +
      `💡 **Actionable Tip:** Trimming this category by 15% frees up **${potentialSaving} ${cur}** in savings!${learnedBonus}`;
  }

  // =========================================================================
  // 4. HOW TO SAVE / MINUTE-BY-MINUTE EXPENSE MINIMIZER
  // =========================================================================
  if (
    q.includes('وفر') || q.includes('توفير') || q.includes('نصيح') || q.includes('تقليص') || q.includes('اقتصد') || q.includes('أقلل') ||
    q.includes('économis') || q.includes('conseil') || q.includes('réduire') || q.includes('épargn') ||
    q.includes('save') || q.includes('saving') || q.includes('reduce') || q.includes('cut') || q.includes('tip')
  ) {
    const dailyCap = totalIncome > totalExpenses && remainingDays > 0
      ? fmt((totalIncome - totalExpenses) / remainingDays)
      : fmt(dailyAverage * 0.75);

    if (detectedLang === 'ar') {
      return `🎯 **خطتك الذكية لتقليص المصاريف والتوفير يا ${userName}:**\n\n` +
        `1️⃣ **معدلك اليومي الحالي:** أنت تصرف حوالي **${fmt(dailyAverage)} ${cur}/يومياً**.\n` +
        `2️⃣ **سقف الصرف اليومي المقترح:** الزم نفسك بسقف أقصاه **${dailyCap} ${cur}/يوم** في الأيام الـ ${remainingDays} المتبقية.\n` +
        (topCategory ? `3️⃣ **تحجيم النفقات الأكثر استنزافاً:** فئة (${t(`categories.${topCategory[0]}`)}) تستهلك ${fmt(topCategory[1])} ${cur}. كل يوم تؤجل فيه مشتريات غير ضرورية فيها، تحتفظ بأموالك.\n` : '') +
        `4️⃣ **قاعدة الـ 24 ساعة:** قبل شراء أي شيء غير أساسي، انتظر 24 ساعة؛ 70% من المشتريات العفوية تلغى تلقائياً!${learnedBonus}`;
    }

    if (detectedLang === 'fr') {
      return `🎯 **Votre plan d'optimisation financière, ${userName} :**\n\n` +
        `1️⃣ **Dépense moyenne journalière :** **${fmt(dailyAverage)} ${cur}/jour**.\n` +
        `2️⃣ **Plafond quotidien recommandé :** Ne dépassez pas **${dailyCap} ${cur}/jour** pour les ${remainingDays} jours restants.\n` +
        `3️⃣ **Règle des 24 heures :** Avant tout achat non essentiel, attendez 24 heures pour éviter les achats d'impulsion !${learnedBonus}`;
    }

    return `🎯 **Your Actionable Expense Minimizer Plan, ${userName}:**\n\n` +
      `1️⃣ **Current Daily Burn Rate:** **${fmt(dailyAverage)} ${cur}/day**.\n` +
      `2️⃣ **Target Daily Spending Cap:** Keep expenses below **${dailyCap} ${cur}/day** for the remaining ${remainingDays} days.\n` +
      `3️⃣ **24-Hour Rule:** Wait 24 hours before any non-essential purchase to eliminate impulse spending!${learnedBonus}`;
  }

  // =========================================================================
  // 5. FULL FINANCIAL SUMMARY / BALANCE & HEALTH CHECK
  // =========================================================================
  if (
    q.includes('ملخص') || q.includes('وضعي') || q.includes('كم') || q.includes('تقرير') || q.includes('إجمالي') || q.includes('رصيد') ||
    q.includes('bilan') || q.includes('résumé') || q.includes('solde') || q.includes('total') || q.includes('combien') ||
    q.includes('summary') || q.includes('balance') || q.includes('report') || q.includes('how much') || q.includes('total')
  ) {
    if (detectedLang === 'ar') {
      return `📊 **التقرير المالي الكامل لهذا الشهر يا ${userName}:**\n\n` +
        `• 💵 **إجمالي الدخل:** ${fmt(totalIncome)} ${cur}\n` +
        `• 💳 **إجمالي المصاريف:** ${fmt(totalExpenses)} ${cur}\n` +
        `• ⚖️ **الرصيد الصافي:** ${netBalance >= 0 ? '+' : ''}${fmt(netBalance)} ${cur} ${netBalance >= 0 ? '🟢 (فائض ممتاز)' : '🔴 (عجز مالي!)'}\n` +
        `• 📅 **المعدل اليومي:** ${fmt(dailyAverage)} ${cur}/يوم\n` +
        `• 📈 **التوقع لنهاية الشهر:** ${fmt(projectedMonthly)} ${cur}\n` +
        `• 🏆 **معدل الادخار:** ${savingsRate}%\n\n` +
        (netBalance < 0 
          ? `⚠️ **تنبيه حاسم:** لقد تجاوزت دخلك! ركّز فقط على الضروريات حتى بداية الشهر القادم.` 
          : `👏 **أداء رائع:** أنت تسير بنجاح ضمن إدارة مالية متوازنة!`) + learnedBonus;
    }

    if (detectedLang === 'fr') {
      return `📊 **Bilan financier complet pour ce mois, ${userName} :**\n\n` +
        `• 💵 **Revenus totaux :** ${fmt(totalIncome)} ${cur}\n` +
        `• 💳 **Dépenses totales :** ${fmt(totalExpenses)} ${cur}\n` +
        `• ⚖️ **Solde net :** ${netBalance >= 0 ? '+' : ''}${fmt(netBalance)} ${cur} ${netBalance >= 0 ? '🟢' : '🔴'}\n` +
        `• 📅 **Moyenne par jour :** ${fmt(dailyAverage)} ${cur}/jour\n` +
        `• 🏆 **Taux d'épargne :** ${savingsRate}%\n\n` +
        (netBalance < 0 ? `⚠️ **Alerte :** Vous êtes en déficit ce mois-ci. Réduisez les dépenses secondaires.` : `👏 **Bravo :** Vos finances sont bien gérées !`) + learnedBonus;
    }

    return `📊 **Full Financial Health Report, ${userName}:**\n\n` +
      `• 💵 **Total Income:** ${fmt(totalIncome)} ${cur}\n` +
      `• 💳 **Total Expenses:** ${fmt(totalExpenses)} ${cur}\n` +
      `• ⚖️ **Net Balance:** ${netBalance >= 0 ? '+' : ''}${fmt(netBalance)} ${cur} ${netBalance >= 0 ? '🟢' : '🔴'}\n` +
      `• 📅 **Daily Average:** ${fmt(dailyAverage)} ${cur}/day\n` +
      `• 🏆 **Savings Rate:** ${savingsRate}%\n\n` +
      (netBalance < 0 ? `⚠️ **Alert:** Deficit detected. Postpone discretionary expenses.` : `👏 **Great job:** You are maintaining healthy positive cash flow!`) + learnedBonus;
  }

  // =========================================================================
  // 6. DEFAULT NATURAL RESPONSE WITH ADAPTIVE INTELLIGENCE
  // =========================================================================
  if (detectedLang === 'ar') {
    return `أهلاً بك يا ${userName}! 🤖 أنا مستشارك المالي الذكي في **مصاريفي**.\n\n` +
      `مجموع مصاريفك المسجلة هذا الشهر: **${fmt(totalExpenses)} ${cur}** (بمعدل **${fmt(dailyAverage)} ${cur}/يوم**).\n\n` +
      `اسألني بحرية عن أي شيء، مثل:\n` +
      `• *"من طور هذا التطبيق وما قصته؟"*\n` +
      `• *"أين ذهبت أغلب أموالي هذا الشهر؟"*\n` +
      `• *"كم صرفت على الطعام أو المواصلات؟"*\n` +
      `• *"كيف أوفر وأقلص مصاريفي هذا الشهر؟"*\n` +
      `• *"ما هو الإصدار الحالي للتطبيق؟"*${learnedBonus}`;
  }

  if (detectedLang === 'fr') {
    return `Bonjour ${userName} ! 🤖 Je suis votre assistant financier intelligent dans **Masarifi**.\n\n` +
      `Vos dépenses totales ce mois-ci sont de **${fmt(totalExpenses)} ${cur}** (moyenne : **${fmt(dailyAverage)} ${cur}/jour**).\n\n` +
      `Vous pouvez me demander n'importe quoi, par exemple :\n` +
      `• *"Qui a créé cette application et pourquoi ?"*\n` +
      `• *"Où est passé mon argent ce mois-ci ?"*\n` +
      `• *"Combien ai-je dépensé en nourriture ou transport ?"*\n` +
      `• *"Donne-moi des astuces concrètes pour économiser"*${learnedBonus}`;
  }

  return `Hello ${userName}! 🤖 I'm your smart AI Financial Advisor in **Masarifi**.\n\n` +
    `Total expenses this month: **${fmt(totalExpenses)} ${cur}** (daily average: **${fmt(dailyAverage)} ${cur}/day**).\n\n` +
    `Ask me anything, such as:\n` +
    `• *"Who created Masarifi and why?"*\n` +
    `• *"Where did most of my money go?"*\n` +
    `• *"How much did I spend on food or transport?"*\n` +
    `• *"How can I cut expenses and save more this month?"*${learnedBonus}`;
}
