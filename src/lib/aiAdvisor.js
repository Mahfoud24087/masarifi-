/**
 * Smart Financial Reasoning Engine for Masarifi
 * Analyzes current user income, expenses, budgets, and spending trends
 * to generate intelligent, actionable advice in Arabic, French, or English.
 */

export function generateFinancialInsight({
  prompt,
  expenses = [],
  totalExpenses = 0,
  totalIncome = 0,
  netBalance = 0,
  budgets = {},
  user = null,
  lang = 'ar',
  t = (k) => k,
}) {
  const q = (prompt || '').trim().toLowerCase();
  const userName = user?.name || (lang === 'ar' ? 'صديقي' : lang === 'fr' ? 'cher ami' : 'friend');

  // Breakdown by category
  const categoryTotals = {};
  const expenseList = expenses.filter((e) => e.type !== 'income');
  expenseList.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0] || null;

  // Days in current month and days passed
  const now = new Date();
  const daysPassed = Math.max(1, now.getDate());
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - daysPassed);
  const dailyAverage = totalExpenses / daysPassed;
  const projectedMonthly = dailyAverage * totalDaysInMonth;

  // Savings rate
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Formatting helpers
  const fmt = (num) => Math.round(num || 0).toLocaleString();
  const cur = lang === 'ar' ? 'أوقية' : 'MRU';

  // -------------------------------------------------------------
  // ARABIC RESPONSES (مع لمسات حسانية وموريتانية دقيقة)
  // -------------------------------------------------------------
  if (lang === 'ar') {
    // 1. Where did my money go / biggest expense
    if (q.includes('أين') || q.includes('وين') || q.includes('أكبر') || q.includes('فيم') || q.includes('أكثر') || q.includes('اكبر')) {
      if (!topCategory) {
        return `مرحباً ${userName}! 📊 لم تسجل أي مصاريف حتى الآن لهذا الشهر. ابدأ بإضافة مشترياتك عبر زر (+) وسأحللها لك فوراً!`;
      }
      const topCatName = t(`categories.${topCategory[0]}`);
      const topCatAmount = fmt(topCategory[1]);
      const topCatPercent = totalExpenses > 0 ? Math.round((topCategory[1] / totalExpenses) * 100) : 0;

      return `أهلاً ${userName}! 🔍 أكبر باب خرجت فيه أموالك هذا الشهر هو **${topCatName}** بمبلغ **${topCatAmount} ${cur}** (${topCatPercent}% من مجموع مصاريفك).\n\n💡 **نصيحتي لك:** إذا خفّضت مصاريف هذا الباب بنسبة 15% فقط، ستوفّر حوالي **${fmt(topCategory[1] * 0.15)} ${cur}** قبل نهاية الشهر!`;
    }

    // 2. Can I save / How to cut expenses / نصائح توفير
    if (q.includes('وفر') || q.includes('توفير') || q.includes('نصيح') || q.includes('تقليص') || q.includes('اقتصد') || q.includes('أقلل')) {
      if (totalExpenses === 0) {
        return `أنت في وضع ممتاز حتى الآن بدون أي مصاريف مسجلة! حدد ميزانية شهرية من الإعدادات لتبقى متحكماً في نفقاتك.`;
      }

      const recDailyBudget = totalIncome > totalExpenses && remainingDays > 0 
        ? fmt((totalIncome - totalExpenses) / remainingDays) 
        : fmt(dailyAverage * 0.8);

      let advice = `إليك خطة ذكية لتقليص نفقاتك يا ${userName}: 🎯\n\n`;
      advice += `1️⃣ **معدلك اليومي الحالي:** أنت تصرف حوالي **${fmt(dailyAverage)} ${cur}/يومياً**.\n`;
      advice += `2️⃣ **السقف اليومي المقترح:** حاول ألا تتجاوز **${recDailyBudget} ${cur}** في الأيام الـ ${remainingDays} المتبقية من الشهر.\n`;
      if (topCategory) {
        advice += `3️⃣ **ركّز على فئة (${t(`categories.${topCategory[0]}`)}):** هي التي تستهلك أكبر جزء (${fmt(topCategory[1])} ${cur}). تقنين الشراء العفوي سيعيد التوازن فوراً لميزانيتك.`;
      }
      return advice;
    }

    // 3. Status summary / ملخص الوضع المالي
    if (q.includes('ملخص') || q.includes('وضعي') || q.includes('كم') || q.includes('تقرير') || q.includes('إجمالي') || q.includes('رصيد')) {
      let status = `📊 **تقرير وضعك المالي لهذا الشهر يا ${userName}:**\n\n`;
      status += `• 💰 **إجمالي الدخل:** ${fmt(totalIncome)} ${cur}\n`;
      status += `• 💸 **إجمالي المصاريف:** ${fmt(totalExpenses)} ${cur}\n`;
      status += `• ⚖️ **الرصيد الصافي:** ${netBalance >= 0 ? '+' : ''}${fmt(netBalance)} ${cur} ${netBalance >= 0 ? '🟢 (ممتاز)' : '🔴 (عجز!)'}\n`;
      status += `• 📅 **المعدل اليومي:** ${fmt(dailyAverage)} ${cur}/يوم\n`;
      status += `• 📈 **التوقع لنهاية الشهر:** ${fmt(projectedMonthly)} ${cur}\n\n`;

      if (netBalance < 0) {
        status += `⚠️ **تنبيه مهم:** مصاريفك تجاوزت دخلك بمقدار ${fmt(Math.abs(netBalance))} ${cur}. يرجى تأجيل النفقات غير الضرورية حتى بداية الشهر القادم!`;
      } else {
        status += `👏 **ممتاز:** معدل ادخارك هو **${savingsRate}%**. واصل على هذا الانضباط!`;
      }
      return status;
    }

    // General greeting & financial check-in
    return `أهلاً بك يا ${userName}! 🤖 أنا مستشارك المالي الذكي في **مصاريفي**.\n\n` +
      `حتى اليوم، مجموع مصاريفك هو **${fmt(totalExpenses)} ${cur}** ومعدلك اليومي **${fmt(dailyAverage)} ${cur}**.\n\n` +
      `اسألني عن أي شيء مثل:\n` +
      `• *"أين ذهبت أغلب أموالي هذا الشهر؟"*\n` +
      `• *"كيف أقلص مصاريفي وأوفر قبل نهاية الشهر؟"*\n` +
      `• *"أعطني ملخصاً شاملاً عن وضعي المالي"*\n` +
      `• *"ما هو أكبر مصروف سجلته؟"*`;
  }

  // -------------------------------------------------------------
  // FRENCH RESPONSES
  // -------------------------------------------------------------
  if (lang === 'fr') {
    if (q.includes('où') || q.includes('plus') || q.includes('grand') || q.includes('dépensé')) {
      if (!topCategory) return `Bonjour ${userName} ! Aucune dépense enregistrée ce mois-ci. Ajoutez vos achats via le bouton (+) !`;
      const topCatName = t(`categories.${topCategory[0]}`);
      return `Bonjour ${userName} ! 🔍 Votre principale dépense ce mois-ci concerne **${topCatName}** avec un montant de **${fmt(topCategory[1])} ${cur}**.\n\n💡 En réduisant cette catégorie de 15%, vous économiserez environ **${fmt(topCategory[1] * 0.15)} ${cur}** d'ici la fin du mois !`;
    }

    if (q.includes('économis') || q.includes('conseil') || q.includes('réduire') || q.includes('épargn')) {
      return `Voici votre plan d'optimisation, ${userName} : 🎯\n\n` +
        `1️⃣ **Moyenne quotidienne :** Vous dépensez environ **${fmt(dailyAverage)} ${cur}/jour**.\n` +
        `2️⃣ **Objectif conseillé :** Ne dépassez pas **${fmt(dailyAverage * 0.8)} ${cur}/jour** pour les ${remainingDays} jours restants.\n` +
        `3️⃣ En limitant les achats impulsifs sur votre catégorie principale (${topCategory ? t(`categories.${topCategory[0]}`) : 'achats'}), vous renforcerez votre épargne !`;
    }

    return `Bonjour ${userName} ! 🤖 Je suis votre conseiller financier dans **Masarifi**.\n\n` +
      `Ce mois-ci, vos dépenses totales sont de **${fmt(totalExpenses)} ${cur}** (moyenne : **${fmt(dailyAverage)} ${cur}/jour**).\n\n` +
      `Posez-moi des questions comme :\n` +
      `• *"Où est passé mon argent ?"*\n` +
      `• *"Comment faire des économies ce mois-ci ?"*\n` +
      `• *"Donne-moi un bilan complet de mes finances"*`;
  }

  // -------------------------------------------------------------
  // ENGLISH RESPONSES
  // -------------------------------------------------------------
  if (q.includes('where') || q.includes('biggest') || q.includes('most') || q.includes('spent')) {
    if (!topCategory) return `Hello ${userName}! No expenses recorded this month yet. Tap (+) to start tracking!`;
    const topCatName = t(`categories.${topCategory[0]}`);
    return `Hello ${userName}! 🔍 Your biggest spending category this month is **${topCatName}** with **${fmt(topCategory[1])} ${cur}**.\n\n💡 Cutting this category by just 15% will save you approximately **${fmt(topCategory[1] * 0.15)} ${cur}** this month!`;
  }

  if (q.includes('save') || q.includes('tip') || q.includes('reduce') || q.includes('cut')) {
    return `Here is your personal savings plan, ${userName}: 🎯\n\n` +
      `1️⃣ **Current Daily Average:** **${fmt(dailyAverage)} ${cur}/day**.\n` +
      `2️⃣ **Recommended Daily Cap:** Stay under **${fmt(dailyAverage * 0.8)} ${cur}/day** for the remaining ${remainingDays} days.\n` +
      `3️⃣ Focusing on trimming **${topCategory ? t(`categories.${topCategory[0]}`) : 'shopping'}** will yield the fastest savings!`;
  }

  return `Hello ${userName}! 🤖 I'm your smart AI Financial Advisor in **Masarifi**.\n\n` +
    `Total expenses this month: **${fmt(totalExpenses)} ${cur}** (daily average: **${fmt(dailyAverage)} ${cur}/day**).\n\n` +
    `You can ask me:\n` +
    `• *"Where did most of my money go?"*\n` +
    `• *"How can I save money before the month ends?"*\n` +
    `• *"Give me a full financial summary"*`;
}
