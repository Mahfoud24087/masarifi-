/**
 * Ultra-Adaptive Financial AI Engine for Masarifi
 * Full Natural Language Understanding in English, French, and Arabic
 */

// Helper to clean and normalize text (strip accents, punctuation, repeated spaces)
function cleanText(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// 1. Detect language intent or explicit switch request
export function detectLanguage(text = '', currentAppLang = 'en', previousLang = null) {
  const norm = cleanText(text);

  // Explicit French switch request or French words
  if (
    norm.includes('francais') || norm.includes('french') || norm.includes('بالفرنسية') ||
    norm.includes('parle francais') || norm.includes('speack in french') || norm.includes('speak in french') ||
    norm.includes('speak french') || norm.includes('en francais')
  ) {
    return 'fr';
  }

  // Explicit English switch request
  if (
    norm.includes('english') || norm.includes('بالانجليزية') || norm.includes('بالانجليزي') ||
    norm.includes('speak english') || norm.includes('talk in english') || norm.includes('en anglais') ||
    norm.includes('speack in english')
  ) {
    return 'en';
  }

  // Explicit Arabic switch request
  if (
    norm.includes('arabic') || norm.includes('بالعربية') || norm.includes('بالعربي') ||
    norm.includes('تكلم بالعربية') || norm.includes('en arabe') || norm.includes('speak arabic')
  ) {
    return 'ar';
  }

  // Detect Arabic characters
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar';
  }

  // Common English words or characters (check English first so 'who did this app' is en)
  const enPattern = /\b(hello|hi|hey|who|what|why|how|where|is|are|this|did|do|does|made|created|developed|app|application|my|spent|expenses|expense|money|save|saving|balance|thanks|thank|yes|no|you|me|i|speack|speak)\b/;
  if (enPattern.test(norm)) {
    return 'en';
  }

  // Common French words
  const frPattern = /\b(bonjour|salut|qui|quoi|pourquoi|comment|combien|est|sont|cette|cet|depense|depenses|argent|creer|cree|developpeur|fait|merci|oui|non|je|tu|il|mon|ma|mes|notre|votre)\b/;
  if (frPattern.test(norm)) {
    return 'fr';
  }

  // Fallback to previous conversation language, or UI language
  return previousLang || currentAppLang || 'en';
}

export function generateFinancialInsight({
  prompt,
  expenses = [],
  totalExpenses = 0,
  totalIncome = 0,
  netBalance = 0,
  budgets = {},
  user = null,
  lang = 'en',
  conversationHistory = [],
  t = (k) => k,
}) {
  const raw = (prompt || '').trim();
  const q = cleanText(raw);

  // Look back at conversation for previous language
  let lastLang = null;
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const prev = conversationHistory[i];
    if (prev.sender === 'user') {
      lastLang = detectLanguage(prev.text, null, null);
      if (lastLang) break;
    }
  }

  // Determine language for this turn (if prompt is generic 'hello' on new chat, use app lang)
  const isInitialLaunch = raw.toLowerCase() === 'hello' && conversationHistory.length === 0;
  const targetLang = isInitialLaunch ? (lang || 'ar') : detectLanguage(raw, lang, lastLang);

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
  // 1. DIRECT LANGUAGE SWITCH REQUESTS
  // =========================================================================
  const isSwitchRequest = 
    /speak (in )?french|speack (in )?french|parle (en )?francais|en francais|بالفرنسية/.test(q) ||
    /speak (in )?english|speack (in )?english|talk in english|بالانجليزية|بالإنجليزي|en anglais/.test(q) ||
    /speak (in )?arabic|talk in arabic|بالعربية|بالعربي|en arabe/.test(q);

  if (isSwitchRequest) {
    if (targetLang === 'fr') {
      return `Oui, avec plaisir ! Je parle désormais en français avec vous. Comment puis-je vous aider avec vos finances ou l'application ? 😊`;
    }
    if (targetLang === 'en') {
      return `Sure! I'm speaking English with you now. How can I assist you with your finances or the app? 😊`;
    }
    if (targetLang === 'ar') {
      return `نعم بكل سرور! سأتحدث معك باللغة العربية من الآن فصاعداً. كيف يمكنني مساعدتك في مصاريفك أو في التطبيق؟ 😊`;
    }
  }

  // =========================================================================
  // 2. GREETINGS
  // =========================================================================
  const isGreeting = 
    /^(hi|hello|hey|bonjour|salut|مرحبا|مرحبا|اهلا|سلام|السلام عليكم|good morning|good evening)\b/i.test(q) &&
    q.length < 25;

  if (isGreeting) {
    if (targetLang === 'en') {
      return `Hello ${userName}! 👋 How can I help you today? Feel free to ask about your budget, expenses, or who created this app.`;
    }
    if (targetLang === 'fr') {
      return `Bonjour ${userName} ! 👋 Comment puis-je vous aider aujourd'hui ? Posez-moi vos questions sur vos dépenses, votre budget ou l'application.`;
    }
    return `مرحباً ${userName}! 👋 كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن مصاريفك، كيفية التوفير، أو معلومات التطبيق.`;
  }

  // =========================================================================
  // 3. WHO CREATED / DEVELOPED / BUILT THIS APP (Crucial query)
  // =========================================================================
  const isAboutCreator =
    /who (did|made|created|built|developed|designed|coded|programmed)/.test(q) ||
    /who is the (developer|creator|maker|author|designer)/.test(q) ||
    /qui (a fait|a cree|a developpe|a concu|creer|cree|fait|developpe|est le developpeur|est le createur)/.test(q) ||
    /(createur|developpeur|developer|creator)/.test(q) ||
    /من (صنع|طور|صمم|انشا|هو المطور|المطور|عمل|برمج)/.test(q);

  if (isAboutCreator) {
    if (targetLang === 'en') {
      return `👨‍💻 **Masarifi** was developed by **Mahfoud Khayri**, a final-year student at SupNum, as a personal initiative to help his community manage their daily expenses in Ouguiya (MRU) before graduating.`;
    }
    if (targetLang === 'fr') {
      return `👨‍💻 **Masarifi** a été développé par **Mahfoud Khayri**, étudiant en dernière année à SupNum, comme une initiative personnelle pour aider sa communauté à gérer leurs dépenses en Ouguiya (MRU) avant d'obtenir son diplôme.`;
    }
    return `👨‍💻 تم تطوير تطبيق **مصاريفي** بواسطة **محفوظ خيري**، وهو طالب في سنته الأخيرة في SupNum، كمبادرة شخصية لخدمة مجتمعه ومساعدتهم على تتبع مصاريفهم اليومية بالأوقية (MRU) قبل تخرجه.`;
  }

  // =========================================================================
  // 3b. HOW TO RATE THE APP / REVIEWS
  // =========================================================================
  const isAboutRating =
    /(how (can|do) i|where can i|how to) rate/i.test(q) ||
    /rate (the app|masarifi)|give (a rating|a review|stars)/i.test(q) ||
    /تقييم|كيف اقيم|كيف أقيم|تقييم التطبيق|اضافة تقييم|اعطاء تقييم/.test(q) ||
    /comment (noter|evaluer)|noter l'application|donner une note|avis/i.test(q);

  if (isAboutRating) {
    if (targetLang === 'en') {
      return `⭐ To rate Masarifi, go to **Settings (⚙️)** in the bottom navigation bar, scroll down to **"Rate the App"**, select from 1 to 5 stars, write your thoughts, and tap **"Submit Review"**! Your review helps the community and appears on the home landing page.`;
    }
    if (targetLang === 'fr') {
      return `⭐ Pour évaluer Masarifi, accédez aux **Paramètres (⚙️)** dans la barre du bas, faites défiler jusqu'à **"Évaluer l'application"**, choisissez entre 1 et 5 étoiles, écrivez votre avis et appuyez sur **"Envoyer l'avis"** !`;
    }
    return `⭐ لتقييم تطبيق مصاريفي، اذهب إلى **الإعدادات (⚙️)** في الشريط السفلي، ثم مرر لأسفل إلى خيار **"تقييم التطبيق"**، اختر من 1 إلى 5 نجوم واكتب تعليقك ثم اضغط **"إرسال التقييم"**! تقييمك يظهر مباشرة على الواجهة الرئيسية لمساعدة المجتمع.`;
  }

  // =========================================================================
  // 3c. HOW TO CREATE AN ACCOUNT / SIGN UP / FOR FRIENDS
  // =========================================================================
  const isAboutAccount =
    /(creat|create|register|sign up|open|make) (an |a )?(account|profil)/i.test(q) ||
    /how (can|do) (i|my friend) (use|join|start)/i.test(q) ||
    /my friend|friend wanna use|for my friend/i.test(q) ||
    /انشاء حساب|تسجيل حساب|كيف اسجل|فتح حساب|صديقي|كيف يستخدم صديقي/.test(q) ||
    /creer un compte|inscription|comment s'inscrire|mon ami/i.test(q);

  if (isAboutAccount) {
    if (targetLang === 'en') {
      return `📝 **Creating an account is very easy and free!**\n\n• Go to the app website: **https://masarifi-nine.vercel.app/** on any phone or browser.\n• Tap **"Get Started"** or **"Sign Up"**.\n• Enter your **Full Name** and a **Password** (min 4 characters).\n• Tap **"Create Account"**.\n\nYour friend can simply open the link on their phone and create their own private account in seconds! Everything syncs securely to the cloud.`;
    }
    if (targetLang === 'fr') {
      return `📝 **Créer un compte est très simple et gratuit !**\n\n• Ouvrez le site : **https://masarifi-nine.vercel.app/** sur n'importe quel téléphone.\n• Appuyez sur **"Commencer"** ou **"Créer un compte"**.\n• Saisissez votre **Nom complet** et un **Mot de passe** (min 4 caractères).\n• Appuyez sur **"Créer un compte"**.\n\nVotre ami peut ouvrir ce même lien pour créer son propre compte personnel en quelques secondes !`;
    }
    return `📝 **إنشاء الحساب سهل جداً ومجاني للجميع!**\n\n• افتح رابط التطبيق: **https://masarifi-nine.vercel.app/** من أي هاتف أو حاسوب.\n• اضغط على **"ابدأ الآن"** أو **"إنشاء حساب"**.\n• أدخل **الاسم الكامل** و**كلمة المرور** (4 أحرف أو أرقام على الأقل).\n• اضغط على **"إنشاء حساب"**.\n\nصديقك يمكنه ببساطة فتح الرابط نفسه على هاتفه وإنشاء حسابه الخاص في ثوانٍ، وبياناته تُحفظ بشكل آمن ومشفر!`;
  }

  // =========================================================================
  // 4. WHAT IS THIS APP / VERSION / PURPOSE
  // =========================================================================
  const isAboutAppOrVersion =
    /what is (this app|masarifi)|what does (it|this app) do|what is it for/i.test(q) ||
    /version|release|build/i.test(q) ||
    /c'est quoi (cette app|cette application|masarifi)|a quoi sert/i.test(q) ||
    /ما هو (هذا التطبيق|تطبيق مصاريفي)|ما فائدة|ماذا يفعل|الاصدار|الإصدار/.test(q);

  if (isAboutAppOrVersion) {
    if (targetLang === 'en') {
      return `📱 **Masarifi (v2.2.0 AI Edition)** is a smart personal finance and expense-tracking app built to help you track spending, categorize transactions, and plan budgets with real-time AI advice.`;
    }
    if (targetLang === 'fr') {
      return `📱 **Masarifi (v2.2.0 Édition IA)** est une application web intelligente de gestion des dépenses personnelles, avec suivi en temps réel et assistant financier.`;
    }
    return `📱 **مصاريفي (الإصدار 2.2.0 الذكي)** هو تطبيق ويب متطور لتتبع المصاريف والدخل وإدارة الميزانيات بدقة مع مستشار ذكاء اصطناعي فوري ومزامنة سحابية.`;
  }

  // =========================================================================
  // 5. USER RECTIFYING OR SAYING "I DIDNT ASK THAT"
  // =========================================================================
  const isClarification =
    /i didnt ask|i did not ask|ce n'est pas ce que|je n'ai pas demande|لم اسال|ما سالتك/.test(q);

  if (isClarification) {
    if (targetLang === 'en') {
      return `My apologies, ${userName}! Please clarify or ask me directly: you can ask who created this app, how much you spent on food/bills, or how to save money.`;
    }
    if (targetLang === 'fr') {
      return `Toutes mes excuses, ${userName} ! Que souhaitez-vous savoir exactement ? Vous pouvez me demander qui a créé l'application, vos dépenses par catégorie, ou des conseils d'économie.`;
    }
    return `عذراً منك يا ${userName}! تفضل بإعادة صياغة سؤالك: يمكنك سؤالي عن من طور التطبيق، كم صرفت على بند معين، أو خطة للتوفير.`;
  }

  // =========================================================================
  // 6. SPECIFIC CATEGORY QUESTIONS (e.g. food, transport, bills)
  // =========================================================================
  const catKeywords = {
    food: ['food', 'eating', 'meals', 'restaurant', 'nourriture', 'repas', 'طعام', 'اكل', 'مطعم'],
    transport: ['transport', 'taxi', 'car', 'fuel', 'gaz', 'مواصلات', 'نقل', 'تاكسي', 'بنزين', 'سيارة'],
    shopping: ['shopping', 'clothes', 'achats', 'vetements', 'تسوق', 'شراء', 'ملابس'],
    bills: ['bills', 'bill', 'electricity', 'water', 'internet', 'facture', 'factures', 'فواتير', 'فاتورة', 'كهرباء', 'ماء', 'انترنت'],
    health: ['health', 'medicine', 'doctor', 'pharmacy', 'sante', 'medicament', 'صحة', 'دواء', 'طبيب', 'صيدلية'],
    entertainment: ['entertainment', 'fun', 'movies', 'divertissement', 'loisirs', 'ترفيه', 'سينما'],
    education: ['education', 'school', 'books', 'etudes', 'livres', 'تعليم', 'دراسة', 'كتب'],
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
  // 7. WHERE DID MY MONEY GO / BIGGEST SPENDING
  // =========================================================================
  const isAskingWhereMoneyWent =
    /where|biggest|most|highest|ou va|ou est|plus grand|majeure|اين|وين|اكبر|اكثر/.test(q);

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
      return `Votre principale dépense ce mois-ci est **${catName}** avec **${fmt(topCat[1])} ${cur}** (${pct}% de vos dépenses totales).`;
    }
    return `أكبر باب صرفت فيه هذا الشهر هو **${catName}** بمبلغ **${fmt(topCat[1])} ${cur}** (${pct}% من مجموع مصاريفك).`;
  }

  // =========================================================================
  // 8. HOW TO SAVE / ADVICE
  // =========================================================================
  const isAskingHowToSave =
    /save|saving|reduce|cut|economis|reduire|epargn|وفر|توفير|اقلل|نصيح/.test(q);

  if (isAskingHowToSave) {
    const dailyCap = totalIncome > totalExpenses && remainingDays > 0
      ? fmt((totalIncome - totalExpenses) / remainingDays)
      : fmt(dailyAverage * 0.8);

    if (targetLang === 'en') {
      return `💡 **Quick Savings Plan:**\n• Limit daily spending to **${dailyCap} ${cur}/day** for the remaining ${remainingDays} days.\n` +
        (topCat ? `• Trimming 15% from **${t(`categories.${topCat[0]}`)}** saves you **${fmt(topCat[1] * 0.15)} ${cur}**.` : '');
    }
    if (targetLang === 'fr') {
      return `💡 **Plan d'économie rapide :**\n• Gardez vos dépenses sous **${dailyCap} ${cur}/jour** pour les ${remainingDays} jours restants.\n` +
        (topCat ? `• Réduire de 15% la catégorie **${t(`categories.${topCat[0]}`)}** vous fera économiser **${fmt(topCat[1] * 0.15)} ${cur}**.` : '');
    }
    return `💡 **خطة توفير سريعة:**\n• اضبط صرفك اليومي بحيث لا يتجاوز **${dailyCap} ${cur}/يوم** في الأيام الـ ${remainingDays} المتبقية.\n` +
      (topCat ? `• تقليل 15% من **${t(`categories.${topCat[0]}`)}** يوفر لك **${fmt(topCat[1] * 0.15)} ${cur}**.` : '');
  }

  // =========================================================================
  // 9. BALANCE / FINANCIAL SUMMARY
  // =========================================================================
  const isAskingBalance =
    /balance|total|income|summary|solde|combien|bilan|رصيد|مجموع|اجمالي|ملخص/.test(q);

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
  // 10. INTELLIGENT DIRECT FALLBACK (IN THE EXACT CONVERSATION LANGUAGE)
  // =========================================================================
  if (targetLang === 'en') {
    return `I am here to help, ${userName}! You've spent **${fmt(totalExpenses)} ${cur}** this month. What specific question do you have about your expenses or this application?`;
  }
  if (targetLang === 'fr') {
    return `Je suis à votre disposition, ${userName} ! Vous avez dépensé **${fmt(totalExpenses)} ${cur}** ce mois-ci. Quelle est votre question spécifique sur vos dépenses ou sur l'application ?`;
  }
  return `أنا في خدمتك يا ${userName}! مجموع مصاريفك هذا الشهر **${fmt(totalExpenses)} ${cur}**. ما هو سؤالك المحدد عن أموالك أو عن التطبيق؟`;
}
