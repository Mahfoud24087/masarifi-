/**
 * Conversational Natural Financial AI for Masarifi
 *
 * Solves:
 * 1. Language switching: If user asks in Arabic "تكلم بالانجليزية", it replies in English.
 * 2. Precision & Conciseness: Answers ONLY what was asked without dumping huge blocks of text.
 * 3. Specific Intent Understanding: Distinguishes greetings, language requests, creator questions,
 *    specific category amounts, general advice, etc.
 * 4. Contextual Memory: Tracks requested language across the conversation.
 */

// Detect if user is asking the AI to switch language
function checkLanguageSwitchRequest(q) {
  // English request
  if (
    q.includes('english') || q.includes('بالانجليزية') || q.includes('بالانجليزي') ||
    q.includes('بالإنجليزي') || q.includes('بالإنكليزي') || q.includes('en anglais') ||
    q.includes('speak english') || q.includes('talk in english') || q.includes('can you speak english')
  ) {
    return 'en';
  }
  // French request
  if (
    q.includes('francais') || q.includes('français') || q.includes('بالفرنسية') ||
    q.includes('بالفرنسي') || q.includes('en français') || q.includes('parle francais') ||
    q.includes('speak french') || q.includes('talk in french')
  ) {
    return 'fr';
  }
  // Arabic request
  if (
    q.includes('arabic') || q.includes('بالعربية') || q.includes('بالعربي') ||
    q.includes('en arabe') || q.includes('parle arabe') || q.includes('speak arabic')
  ) {
    return 'ar';
  }
  return null;
}

// Infer current language of the text itself
function inferTextLanguage(text, activeLanguage = 'ar') {
  if (!text) return activeLanguage;
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  
  const frWords = /\b(bonjour|salut|oui|non|merci|combien|pourquoi|comment|qui|dépense|dépenses|argent|nourriture|repas|transport|facture|économiser|solde|est-ce|j'ai|mon|ma|mes)\b/i;
  if (frWords.test(text)) return 'fr';
  
  const enWords = /\b(hello|hi|yes|no|thanks|thank you|how much|why|how|who|what|where|expense|expenses|money|food|bills|save|balance|can you|did i|my)\b/i;
  if (enWords.test(text)) return 'en';
  
  return activeLanguage;
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
  const raw = (prompt || '').trim();
  const q = raw.toLowerCase();

  // Check if conversation previously established a language override
  let preferredLang = null;
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const sw = checkLanguageSwitchRequest(conversationHistory[i].text.toLowerCase());
    if (sw) {
      preferredLang = sw;
      break;
    }
  }

  // Current turn switch request takes top priority
  const currentSwitch = checkLanguageSwitchRequest(q);
  const targetLang = currentSwitch || preferredLang || inferTextLanguage(raw, lang);

  const userName = user?.name || (targetLang === 'ar' ? 'صديقي' : targetLang === 'fr' ? 'cher ami' : 'friend');
  const cur = targetLang === 'ar' ? 'أوقية' : 'MRU';
  const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();

  // Category totals
  const categoryTotals = {};
  expenses
    .filter((e) => (e.type || 'expense') === 'expense')
    .forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
    });

  const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats[0] || null;

  const now = new Date();
  const daysPassed = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - daysPassed);
  const dailyAverage = totalExpenses / daysPassed;

  // =========================================================================
  // 1. DIRECT LANGUAGE SWITCH CONFIRMATION
  // =========================================================================
  if (currentSwitch) {
    if (currentSwitch === 'en') {
      return `Yes, absolutely! I can speak English with you now. What would you like to know about your expenses or finances? 😊`;
    }
    if (currentSwitch === 'fr') {
      return `Oui, bien sûr ! Je peux désormais échanger avec vous en français. Que souhaitez-vous savoir sur vos finances ou vos dépenses ? 😊`;
    }
    if (currentSwitch === 'ar') {
      return `نعم بالتأكيد! سأتحدث معك باللغة العربية من الآن فصاعداً. كيف يمكنني مساعدتك في إدارة مصاريفك اليوم؟ 😊`;
    }
  }

  // =========================================================================
  // 2. GREETINGS (Short & direct, not a data dump)
  // =========================================================================
  const isGreeting = 
    /^(مرحبا|مرحباً|أهلاً|اهلا|سلام|السلام عليكم|صباح الخير|مساء الخير|hi|hello|hey|good morning|bonjour|salut)\b/i.test(q) &&
    q.length < 25;

  if (isGreeting) {
    if (targetLang === 'en') {
      return `Hello ${userName}! 👋 How can I help you today? You can ask me about your spending, how to save, or about the app.`;
    }
    if (targetLang === 'fr') {
      return `Bonjour ${userName} ! 👋 Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur vos dépenses ou sur vos économies.`;
    }
    return `مرحباً بك يا ${userName}! 👋 كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن مصاريفك، كيفية التوفير، أو أي تفاصيل حول التطبيق.`;
  }

  // =========================================================================
  // 3. WHO CREATED THE APP / DEVELOPER / VERSION (Targeted response)
  // =========================================================================
  const isAboutCreator =
    q.includes('من صنع') || q.includes('من طور') || q.includes('من هو المطور') || q.includes('من صمم') ||
    q.includes('من أنشأ') || q.includes('who created') || q.includes('who made') || q.includes('who built') ||
    q.includes('who developed') || q.includes('who is the developer') || q.includes('qui a créé') ||
    q.includes('qui a développé') || q.includes('qui est le développeur');

  if (isAboutCreator) {
    if (targetLang === 'en') {
      return `👨‍💻 **Masarifi** was developed by **Mahfoud** in 2026 to help people easily manage their money, track expenses in Mauritanian Ouguiya (MRU), and achieve financial control.`;
    }
    if (targetLang === 'fr') {
      return `👨‍💻 **Masarifi** a été développé par **Mahfoud** en 2026 pour aider la communauté à maîtriser ses dépenses quotidiennes en Ouguiya (MRU) et à épargner plus efficacement.`;
    }
    return `👨‍💻 تم تطوير تطبيق **مصاريفي** بواسطة **محفوظ (Mahfoud)** في عام 2026 لمساعدة المجتمع على إدارة المصاريف اليومية بالأوقية والتحكم في الميزانية بسهولة.`;
  }

  // What is this app / Version / Launch info
  const isAboutAppOrVersion =
    q.includes('ما هو هذا التطبيق') || q.includes('ما هو تطبيق') || q.includes('ما فائدة التطبيق') ||
    q.includes('الاصدار') || q.includes('الإصدار') || q.includes('نسخة') ||
    q.includes('what is this app') || q.includes('what is masarifi') || q.includes('version') ||
    q.includes('c\'est quoi cette application') || q.includes('quelle est la version');

  if (isAboutAppOrVersion) {
    if (targetLang === 'en') {
      return `📱 **Masarifi (v2.1.0 AI Edition)** is an intelligent personal finance and expense-tracking Progressive Web App with cloud database sync and real-time AI coaching.`;
    }
    if (targetLang === 'fr') {
      return `📱 **Masarifi (v2.1.0 Édition IA)** est une application web progressive de gestion financière personnelle, synchronisée dans le cloud et dotée d'un conseiller IA intelligent.`;
    }
    return `📱 **مصاريفي (الإصدار 2.1.0 الذكي)** هو تطبيق ويب متطور لتتبع المصاريف والدخل وإدارة الميزانيات بدقة مع مستشار ذكاء اصطناعي فوري ومزامنة سحابية.`;
  }

  // =========================================================================
  // 4. SPECIFIC CATEGORY QUESTIONS (e.g. "كم صرفت على الطعام؟" or "how much on food?")
  // =========================================================================
  const catKeywords = {
    food: ['طعام', 'أكل', 'مطعم', 'food', 'eating', 'meals', 'nourriture', 'restaurant', 'repas'],
    transport: ['مواصلات', 'نقل', 'تاكسي', 'بنزين', 'سيارة', 'transport', 'taxi', 'car', 'fuel', 'gaz'],
    shopping: ['تسوق', 'شراء', 'ملابس', 'shopping', 'clothes', 'achats', 'vêtements'],
    bills: ['فواتير', 'فاتورة', 'كهرباء', 'ماء', 'انترنت', 'bills', 'bill', 'electricity', 'water', 'internet', 'facture', 'factures'],
    health: ['صحة', 'دواء', 'طبيب', 'صيدلية', 'health', 'medicine', 'doctor', 'pharmacy', 'santé', 'médicament'],
    entertainment: ['ترفيه', 'سينما', 'رحلة', 'entertainment', 'fun', 'movies', 'divertissement', 'loisirs'],
    education: ['تعليم', 'دراسة', 'كتب', 'education', 'school', 'books', 'études', 'livres'],
  };

  for (const [catKey, words] of Object.entries(catKeywords)) {
    if (words.some((w) => q.includes(w))) {
      const amount = categoryTotals[catKey] || 0;
      const catLabel = t(`categories.${catKey}`);
      const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;

      if (targetLang === 'en') {
        return `You have spent **${fmt(amount)} ${cur}** on **${catLabel}** this month (${pct}% of your total spending).`;
      }
      if (targetLang === 'fr') {
        return `Vous avez dépensé **${fmt(amount)} ${cur}** en **${catLabel}** ce mois-ci (${pct}% de vos dépenses totales).`;
      }
      return `لقد صرفت **${fmt(amount)} ${cur}** على **${catLabel}** هذا الشهر (${pct}% من إجمالي مصاريفك).`;
    }
  }

  // =========================================================================
  // 5. WHERE DID MY MONEY GO / BIGGEST SPENDING
  // =========================================================================
  const isAskingWhereMoneyWent =
    q.includes('أين') || q.includes('وين') || q.includes('أكبر') || q.includes('أكثر') ||
    q.includes('where') || q.includes('biggest') || q.includes('most') ||
    q.includes('où') || q.includes('plus grand') || q.includes('majeure');

  if (isAskingWhereMoneyWent) {
    if (!topCat || topCat[1] === 0) {
      if (targetLang === 'en') return `You haven't recorded any expenses yet this month! Tap (+) to add one.`;
      if (targetLang === 'fr') return `Vous n'avez encore enregistré aucune dépense ce mois-ci ! Appuyez sur (+) pour en ajouter une.`;
      return `لم تسجل أي مصاريف حتى الآن لهذا الشهر! اضغط على (+) لإضافة أول معاملة.`;
    }

    const catName = t(`categories.${topCat[0]}`);
    const pct = totalExpenses > 0 ? Math.round((topCat[1] / totalExpenses) * 100) : 0;

    if (targetLang === 'en') {
      return `Your biggest expense this month is **${catName}** at **${fmt(topCat[1])} ${cur}** (${pct}% of all spending).`;
    }
    if (targetLang === 'fr') {
      return `Votre principale dépense ce mois-ci est **${catName}** avec **${fmt(topCat[1])} ${cur}** (${pct}% de vos dépenses).`;
    }
    return `أكبر باب صرفت فيه هذا الشهر هو **${catName}** بمبلغ **${fmt(topCat[1])} ${cur}** (${pct}% من مجموع مصاريفك).`;
  }

  // =========================================================================
  // 6. HOW TO SAVE / REDUCE EXPENSES
  // =========================================================================
  const isAskingHowToSave =
    q.includes('وفر') || q.includes('توفير') || q.includes('أقلل') || q.includes('نصيح') ||
    q.includes('save') || q.includes('saving') || q.includes('reduce') || q.includes('cut') ||
    q.includes('économis') || q.includes('réduire') || q.includes('épargn');

  if (isAskingHowToSave) {
    const dailyCap = totalIncome > totalExpenses && remainingDays > 0
      ? fmt((totalIncome - totalExpenses) / remainingDays)
      : fmt(dailyAverage * 0.8);

    if (targetLang === 'en') {
      return `💡 **Quick Savings Plan:**\n• Keep your daily spending under **${dailyCap} ${cur}/day** for the remaining ${remainingDays} days.\n` +
        (topCat ? `• Trimming just 15% from **${t(`categories.${topCat[0]}`)}** will save you **${fmt(topCat[1] * 0.15)} ${cur}** this month.` : '');
    }
    if (targetLang === 'fr') {
      return `💡 **Plan d'économie rapide :**\n• Gardez vos dépenses sous **${dailyCap} ${cur}/jour** pour les ${remainingDays} jours restants.\n` +
        (topCat ? `• Réduire de 15% la catégorie **${t(`categories.${topCat[0]}`)}** vous fera économiser **${fmt(topCat[1] * 0.15)} ${cur}**.` : '');
    }
    return `💡 **خطة توفير سريعة ومباشرة:**\n• اضبط سقف صرفك اليومي بحيث لا يتجاوز **${dailyCap} ${cur}/يوم** في الأيام الـ ${remainingDays} المتبقية.\n` +
      (topCat ? `• إذا خفّضت 15% فقط من مصاريف **${t(`categories.${topCat[0]}`)}**، ستوفر **${fmt(topCat[1] * 0.15)} ${cur}** قبل نهاية الشهر.` : '');
  }

  // =========================================================================
  // 7. BALANCE / TOTAL SUMMARY
  // =========================================================================
  const isAskingBalance =
    q.includes('رصيد') || q.includes('كم معي') || q.includes('مجموع') || q.includes('إجمالي') || q.includes('ملخص') ||
    q.includes('balance') || q.includes('total') || q.includes('how much') || q.includes('summary') ||
    q.includes('solde') || q.includes('combien') || q.includes('bilan');

  if (isAskingBalance) {
    if (targetLang === 'en') {
      return `📊 **Financial Status:**\n• Total Income: **${fmt(totalIncome)} ${cur}**\n• Total Expenses: **${fmt(totalExpenses)} ${cur}**\n• Net Balance: **${netBalance >= 0 ? '+' : ''}${fmt(netBalance)} ${cur}**`;
    }
    if (targetLang === 'fr') {
      return `📊 **Situation Financière :**\n• Revenus : **${fmt(totalIncome)} ${cur}**\n• Dépenses : **${fmt(totalExpenses)} ${cur}**\n• Solde net : **${netBalance >= 0 ? '+' : ''}${fmt(netBalance)} ${cur}**`;
    }
    return `📊 **الوضع المالي الحالي:**\n• إجمالي الدخل: **${fmt(totalIncome)} ${cur}**\n• إجمالي المصاريف: **${fmt(totalExpenses)} ${cur}**\n• الرصيد الصافي: **${netBalance >= 0 ? '+' : ''}${fmt(netBalance)} ${cur}**`;
  }

  // =========================================================================
  // 8. CONCISE ADAPTIVE FALLBACK
  // =========================================================================
  if (targetLang === 'en') {
    return `I'm listening, ${userName}! You've spent **${fmt(totalExpenses)} ${cur}** this month. What specific question do you have about your spending or the app?`;
  }
  if (targetLang === 'fr') {
    return `Je suis à votre écoute, ${userName} ! Vous avez dépensé **${fmt(totalExpenses)} ${cur}** ce mois-ci. Quelle est votre question sur vos finances ou l'application ?`;
  }
  return `أنا في الاستماع يا ${userName}! مجموع مصاريفك هذا الشهر **${fmt(totalExpenses)} ${cur}**. ما هو سؤالك المحدد عن أموالك أو عن التطبيق؟`;
}
