// ═══════════════════════════════════════════════════════════════
// MEDICAL RULES — Scientifically Correct Clinical Guidelines
// Sources: AHA/ACC 2025, ADA Standards of Care 2024, WHO
// ⚠️ For hackathon prototype only — not a substitute for medical advice
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// SECTION 1: BLOOD SUGAR (GLUCOSE) RULES
// Source: ADA Standards of Care 2024
// ─────────────────────────────────────────────────────────────

export const BLOOD_SUGAR_RULES = {

  // ── FASTING GLUCOSE (no food for 8+ hours) ──
  fasting: {
    normal:      { min: 70,  max: 99,  label: "طبيعي صائماً",      color: "#22c55e", severity: "normal"   },
    prediabetes: { min: 100, max: 125, label: "ما قبل السكري",      color: "#f59e0b", severity: "warning"  },
    diabetes:    { min: 126, max: Infinity, label: "سكري (صائماً)", color: "#ef4444", severity: "danger"   },
  },

  // ── POST-MEAL GLUCOSE (2 hours after eating) ──
  postMeal: {
    normal:      { min: 0,   max: 139, label: "طبيعي بعد الأكل",    color: "#22c55e", severity: "normal"   },
    acceptable:  { min: 140, max: 179, label: "مقبول بعد الأكل",    color: "#f59e0b", severity: "warning"  },
    high:        { min: 180, max: 249, label: "مرتفع بعد الأكل",    color: "#ef4444", severity: "danger"   },
    veryHigh:    { min: 250, max: Infinity, label: "مرتفع جداً",    color: "#dc2626", severity: "critical" },
  },

  // ── GENERAL READINGS (unknown timing — used in chatbot) ──
  general: [
    { min: 0,   max: 53,  label: "انخفاض حاد — طوارئ فورية 🚨",  color: "#dc2626", severity: "critical",
      action: "اتصل بالإسعاف فوراً. هذا مستوى خطير جداً يمكن أن يسبب فقدان الوعي." },

    { min: 54,  max: 69,  label: "منخفض — تدخل فوري ⬇️",         color: "#3b82f6", severity: "danger",
      action: "تناول 15 غرام كربوهيدرات سريعة الآن (4 أقراص غلوكوز، أو نصف كوب عصير برتقال، أو 3 ملاعق سكر). أعد القياس بعد 15 دقيقة." },

    { min: 70,  max: 99,  label: "طبيعي صائماً ✅",               color: "#22c55e", severity: "normal",
      action: "قراءة ممتازة. استمر في نمط حياتك الصحي." },

    { min: 100, max: 125, label: "ما قبل السكري ⚠️",              color: "#f59e0b", severity: "warning",
      action: "تحتاج مراجعة طبيب وتغيير نمط الحياة. هذا المستوى قابل للعكس بالنظام الغذائي والرياضة." },

    { min: 126, max: 139, label: "مرتفع قليلاً 🔸",               color: "#f97316", severity: "warning",
      action: "تجنب السكريات والنشويات البيضاء. شرب الماء يساعد. راجع طبيبك لتعديل الجرعة إذا لزم." },

    { min: 140, max: 179, label: "مرتفع ⚠️",                      color: "#f59e0b", severity: "warning",
      action: "تجنب الأكل السكري. المشي الخفيف 15 دقيقة قد يساعد. راجع طبيبك إذا تكرر هذا المستوى." },

    { min: 180, max: 249, label: "مرتفع جداً 🔴",                  color: "#ef4444", severity: "danger",
      action: "اشرب ماء كثيراً. لا تمارس رياضة شاقة. راجع الطبيب اليوم لتعديل العلاج." },

    { min: 250, max: 299, label: "خطير — راجع الطبيب 🔴",         color: "#dc2626", severity: "critical",
      action: "تحقق من وجود كيتونات في البول إذا أمكن. اشرب ماء. راجع الطبيب أو الطوارئ فوراً." },

    { min: 300, max: 399, label: "خطير جداً 🚨",                   color: "#dc2626", severity: "critical",
      action: "اذهب للطوارئ الآن. هذا المستوى يمكن أن يسبب الحماض الكيتوني السكري (DKA)." },

    { min: 400, max: Infinity, label: "طارئ طبي 🚨",               color: "#7f1d1d", severity: "emergency",
      action: "اتصل بالإسعاف فوراً. لا تنتظر. هذا مستوى طارئ قد يكون مهدداً للحياة." },
  ],

  // ── HbA1c TARGETS ──
  hba1c: {
    excellent:  { min: 0,   max: 6.4,  label: "ممتاز",             color: "#22c55e" },
    good:       { min: 6.5, max: 6.9,  label: "جيد",               color: "#86efac" },
    acceptable: { min: 7.0, max: 7.9,  label: "مقبول — يحتاج تحسين", color: "#f59e0b" },
    poor:       { min: 8.0, max: 8.9,  label: "ضعيف — راجع الطبيب", color: "#f97316" },
    veryPoor:   { min: 9.0, max: Infinity, label: "سيء جداً — تدخل عاجل", color: "#ef4444" },
    // ADA 2024 target: < 7% for most adults, < 8% for elderly/complex
    adaTarget: 7.0,
    elderlyTarget: 8.0,
  },

  // ── EMERGENCY SYMPTOMS WITH SUGAR LEVELS ──
  emergencies: {
    hypoglycemia: {
      threshold: 54,
      symptoms: ["فقدان الوعي", "تشنجات", "رجفة شديدة", "تعرق بارد", "ارتباك شديد"],
      action: "اتصل بالإسعاف 911 فوراً. إذا كان المريض واعياً أعطه سكر سريع. لا تعطي سائل لمريض فاقد الوعي.",
    },
    DKA: { // Diabetic Ketoacidosis
      thresholdGlucose: 250,
      symptoms: ["غثيان وتقيؤ", "ألم في البطن", "تنفس سريع وعميق", "رائحة فم كالفاكهة/أسيتون", "ارتباك"],
      action: "طوارئ فورية. اتصل بالإسعاف. شائع في النوع الأول.",
    },
    HHS: { // Hyperosmolar Hyperglycemic State
      thresholdGlucose: 600,
      symptoms: ["نعاس شديد", "ارتباك", "جفاف حاد", "ضعف في جهة واحدة"],
      action: "طوارئ فورية. أكثر شيوعاً في النوع الثاني كبار السن.",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// SECTION 2: BLOOD PRESSURE RULES
// Source: AHA/ACC 2025 Guidelines
// ─────────────────────────────────────────────────────────────

export const BLOOD_PRESSURE_RULES = {

  // ── CLASSIFICATION (AHA/ACC 2025) ──
  // Uses systolic OR diastolic — whichever is higher category wins
  categories: [
    {
      label: "منخفض — انخفاض الضغط",
      labelEn: "Hypotension",
      systolicMax: 89, diastolicMax: 59,
      color: "#60a5fa", severity: "warning",
      action: "اشرب سوائل وماء. إذا شعرت بدوخة أو إغماء اجلس فوراً. راجع الطبيب إذا تكرر.",
    },
    {
      label: "طبيعي ✅",
      labelEn: "Normal",
      systolicMin: 90, systolicMax: 119,
      diastolicMin: 60, diastolicMax: 79,
      color: "#22c55e", severity: "normal",
      action: "قراءة ممتازة. حافظ على نمط حياتك الصحي.",
    },
    {
      label: "مرتفع قليلاً ⚠️",
      labelEn: "Elevated",
      // Systolic 120-129 AND diastolic < 80
      systolicMin: 120, systolicMax: 129,
      diastolicMax: 79,
      color: "#f59e0b", severity: "warning",
      action: "تجنب الملح الزائد والتوتر. ممارسة الرياضة تساعد. راجع طبيبك لمتابعة دورية.",
    },
    {
      label: "ارتفاع ضغط — المرحلة الأولى ⚠️",
      labelEn: "Hypertension Stage 1",
      // Systolic 130-139 OR diastolic 80-89
      systolicMin: 130, systolicMax: 139,
      diastolicMin: 80, diastolicMax: 89,
      color: "#f97316", severity: "warning",
      action: "تغيير نمط الحياة ضروري: تقليل الملح، رياضة، خفض الوزن. قد يحتاج الطبيب بدء دواء.",
    },
    {
      label: "ارتفاع ضغط — المرحلة الثانية 🔴",
      labelEn: "Hypertension Stage 2",
      // Systolic ≥ 140 OR diastolic ≥ 90
      systolicMin: 140, systolicMax: 179,
      diastolicMin: 90, diastolicMax: 119,
      color: "#ef4444", severity: "danger",
      action: "راجع الطبيب قريباً. على الأغلب يحتاج دوائين أو أكثر. تجنب المجهود الشديد.",
    },
    {
      label: "أزمة ضغط — طوارئ فورية 🚨",
      labelEn: "Hypertensive Crisis",
      // Systolic > 180 AND/OR diastolic > 120
      systolicMin: 180,
      diastolicMin: 120,
      color: "#dc2626", severity: "emergency",
      action: "اتصل بالإسعاف فوراً. اجلس وارتاح. لا تأخذ دواء إضافي بدون توجيه طبي. هذا طارئ.",
    },
  ],

  // ── SIMPLE FUNCTION LOGIC (for code use) ──
  // Call: getBPCategory(systolic, diastolic)
  getCategory: (sys, dia) => {
    if (sys > 180 || dia > 120) return "emergency";
    if (sys >= 140 || dia >= 90) return "stage2";
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return "stage1";
    if (sys >= 120 && sys <= 129 && dia < 80) return "elevated";
    if (sys >= 90 && sys < 120 && dia >= 60 && dia < 80) return "normal";
    return "low";
  },

  // ── TREATMENT TARGETS ──
  targets: {
    generalAdult:     { systolic: 130, diastolic: 80,  note: "الهدف العام لمعظم البالغين (AHA 2025)" },
    diabeticPatient:  { systolic: 130, diastolic: 80,  note: "مريض السكري — نفس الهدف العام" },
    elderlyOver65:    { systolic: 130, diastolic: 80,  note: "كبار السن إذا كانوا يتحملون العلاج" },
    kidneyDisease:    { systolic: 120, diastolic: 80,  note: "مرضى الكلى مع بروتين في البول" },
  },

  // ── EMERGENCY SYMPTOMS (Hypertensive Crisis) ──
  emergencySymptoms: [
    "صداع شديد مفاجئ خاصة في مؤخرة الرأس",
    "ضبابية الرؤية أو فقدان البصر المفاجئ",
    "ألم شديد في الصدر",
    "ضيق في التنفس المفاجئ",
    "ضعف أو تنميل في الوجه أو الذراع أو الساق",
    "صعوبة في الكلام",
    "دوخة شديدة أو فقدان توازن",
  ],
  note: "إذا كان الضغط > 180/120 مع أي من هذه الأعراض → اتصل بالإسعاف فوراً",

  // ── LIFESTYLE RECOMMENDATIONS ──
  lifestyle: {
    salt:     "أقل من 2300 ملغ صوديوم يومياً (حوالي ملعقة صغيرة ملح)",
    exercise: "150 دقيقة نشاط معتدل أسبوعياً (مشي 30 دقيقة × 5 أيام)",
    weight:   "كل كيلو تخسره يخفض الضغط بمقدار 1 mmHg تقريباً",
    alcohol:  "رجال: لا أكثر من مشروبين يومياً. حد الأمان يختلف بالمنطقة",
    smoking:  "التدخين يرفع الضغط فوراً ويضر الأوعية الدموية بشكل دائم",
    dash:     "نظام DASH غذائي: خضروات، فواكه، منتجات قليلة الدسم، تقليل الملح",
  },
};

// ─────────────────────────────────────────────────────────────
// SECTION 3: SHARED DANGEROUS SYMPTOMS
// Bot must escalate these IMMEDIATELY regardless of reading
// ─────────────────────────────────────────────────────────────

export const IMMEDIATE_EMERGENCY_SYMPTOMS = [
  "فقدان الوعي",
  "تشنجات",
  "ألم شديد في الصدر",
  "ضيق في التنفس المفاجئ",
  "شلل في الوجه أو اليد أو الساق",
  "صعوبة في الكلام",
  "رؤية مزدوجة أو فقدان البصر المفاجئ",
  "صداع رعدي (الأشد في الحياة)",
  "تقيؤ متكرر مع ارتباك",
  "عدم الاستجابة",
];

export const URGENT_SYMPTOMS = [
  "دوخة شديدة",
  "رجفة لا تتوقف",
  "تعرق بارد مفاجئ",
  "خفقان قلب سريع جداً",
  "ضعف مفاجئ عام",
  "تورم مفاجئ في الوجه أو اللسان",
];

// ─────────────────────────────────────────────────────────────
// SECTION 4: MEDICATIONS KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────

export const MEDICATIONS_INFO = {
  // ── DIABETES MEDICATIONS ──
  diabetes: {
    metformin: {
      name: "ميتفورمين (Metformin)",
      class: "Biguanide",
      timing: "مع الأكل أو بعده مباشرة لتقليل الغثيان",
      sideEffects: ["غثيان وإسهال في البداية (يتحسن بعد أسبوعين)", "نقص فيتامين B12 على المدى الطويل"],
      missedDose: "خذ الجرعة فور تذكرها مع الأكل. لا تضاعف الجرعة.",
      hypoglycemiaRisk: "منخفض جداً عند استخدامه وحده",
      renalCaution: "يوقف عند GFR < 30 مل/دقيقة",
    },
    glibenclamide: {
      name: "غليبنكلاميد / جليبيزيد (Glibenclamide/Glipizide)",
      class: "Sulfonylurea",
      timing: "قبل الأكل بـ 30 دقيقة",
      sideEffects: ["انخفاض السكر إذا تأخر الأكل", "زيادة في الوزن"],
      missedDose: "تخطَّ الجرعة إذا فاتك وقتها ولم تأكل. لا تضاعف.",
      hypoglycemiaRisk: "مرتفع — يجب الأكل بعد أخذه مباشرة",
      warning: "⚠️ إذا أخذت الدواء ولم تأكل → خطر انخفاض السكر",
    },
    sitagliptin: {
      name: "سيتاغليبتين (Sitagliptin / Januvia)",
      class: "DPP-4 Inhibitor",
      timing: "في أي وقت مع أو بدون أكل",
      sideEffects: ["نادر الآثار الجانبية", "التهاب أنف نادر"],
      hypoglycemiaRisk: "منخفض جداً",
    },
    empagliflozin: {
      name: "إمباغليفلوزين (Empagliflozin / Jardiance)",
      class: "SGLT-2 Inhibitor",
      timing: "الصباح مع أو بدون أكل",
      sideEffects: ["التهاب المسالك البولية", "التهاب منطقة التناسلية", "كثرة التبول"],
      missedDose: "خذه فور تذكره في نفس اليوم. إذا جاء اليوم التالي تخطه.",
      hypoglycemiaRisk: "منخفض عند استخدامه وحده",
      warning: "⚠️ أوقفه قبل عمليات جراحية بـ 3 أيام على الأقل",
    },
    insulin: {
      name: "الأنسولين (Insulin)",
      types: {
        rapidActing:  { name: "سريع المفعول (Aspart/Lispro)", onset: "10-15 دقيقة", peak: "1-2 ساعة", duration: "3-5 ساعات", timing: "قبيل الأكل مباشرة" },
        shortActing:  { name: "قصير المفعول (Regular)", onset: "30-60 دقيقة", peak: "2-3 ساعات", duration: "6-8 ساعات", timing: "قبل الأكل بـ 30 دقيقة" },
        intermediate: { name: "متوسط المفعول (NPH)", onset: "1-2 ساعة", peak: "4-6 ساعات", duration: "12-18 ساعة", timing: "مرتين يومياً عادة" },
        longActing:   { name: "طويل المفعول (Glargine/Detemir)", onset: "1-2 ساعة", peak: "لا يوجد ذروة واضحة", duration: "22-24 ساعة", timing: "مرة يومياً في نفس الوقت" },
      },
      storage: "في الثلاجة (2-8 درجات) قبل الفتح. بعد الفتح في درجة حرارة الغرفة حتى 28 يوم.",
      injectionSites: ["البطن (الأسرع امتصاصاً)", "الفخذ", "الذراع الخلفي", "الأرداف"],
      rotation: "دوِّر مواضع الحقن لتجنب تصلب الأنسجة (Lipohypertrophy)",
      missedDose: "يعتمد على النوع — راجع الطبيب دائماً للأنسولين الطويل",
    },
  },

  // ── HYPERTENSION MEDICATIONS ──
  hypertension: {
    amlodipine: {
      name: "أملوديبين (Amlodipine / Norvasc)",
      class: "Calcium Channel Blocker",
      timing: "مرة واحدة يومياً في أي وقت",
      sideEffects: ["تورم الكاحلين", "احمرار الوجه", "صداع في البداية"],
      missedDose: "خذه فور تذكره. إذا اقترب وقت الجرعة التالية تخطه.",
    },
    losartan: {
      name: "لوسارتان (Losartan / Cozaar)",
      class: "ARB (Angiotensin Receptor Blocker)",
      timing: "مرة أو مرتين يومياً مع أو بدون أكل",
      sideEffects: ["دوخة في البداية", "نادراً: ارتفاع البوتاسيوم"],
      warning: "ممنوع أثناء الحمل تماماً",
    },
    lisinopril: {
      name: "ليسينوبريل (Lisinopril)",
      class: "ACE Inhibitor",
      timing: "مرة يومياً في أي وقت",
      sideEffects: ["سعال جاف مستمر (شائع 10-15%)", "دوخة أول أسبوع"],
      warning: "ممنوع أثناء الحمل. إذا ظهر سعال جاف راجع الطبيب لتغييره",
    },
    hydrochlorothiazide: {
      name: "هيدروكلوروثيازيد (HCTZ)",
      class: "Thiazide Diuretic",
      timing: "الصباح (لتجنب كثرة التبول ليلاً)",
      sideEffects: ["كثرة التبول", "نقص البوتاسيوم", "الحساسية للشمس"],
      monitoring: "راقب مستوى البوتاسيوم بشكل دوري",
    },
    atenolol: {
      name: "أتينولول (Atenolol)",
      class: "Beta Blocker",
      timing: "مرة يومياً في الصباح مع أو بدون أكل",
      sideEffects: ["بطء القلب", "تعب", "برودة الأطراف", "أحلام نابضة"],
      warning: "لا توقفه فجأة — يجب التقليل التدريجي تحت إشراف طبي",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// SECTION 5: DIET RULES (Scientifically Correct)
// ─────────────────────────────────────────────────────────────

export const DIET_RULES = {
  diabetes: {
    avoid: [
      "مشروبات غازية وعصائر معلبة — ترفع السكر بسرعة شديدة",
      "الحلويات والسكر الأبيض والعسل (بكميات كبيرة)",
      "الخبز الأبيض والأرز الأبيض والمعكرونة الزائدة",
      "البطاطس المقلية والأطعمة المقلية",
      "الفواكه عالية السكر بكميات كبيرة: تمر، مانجو، عنب، موز ناضج",
    ],
    caution: [
      "الفواكه: مسموح بكميات معقولة مع مراقبة السكر (تفاح، فراولة، توت أفضل خيار)",
      "الأرز البني والخبز الأسمر: أفضل من الأبيض لكن بكميات محددة",
      "العسل: يرفع السكر مثل السكر العادي تماماً رغم أنه طبيعي",
      "الحليب: يحتوي لاكتوز — كوب واحد مع وجبة مقبول",
    ],
    recommended: [
      "الخضروات الورقية: خس، سبانخ، جرجير، خيار، كوسا — مسموح بحرية",
      "البروتين الخالي من الدهن: دجاج بدون جلد، سمك، بيض",
      "المكسرات غير المملحة: لوز، جوز، فستق — حفنة صغيرة يومياً",
      "الأطعمة الغنية بالألياف تبطئ امتصاص السكر",
      "الماء: 8-10 أكواب يومياً — أفضل مشروب لمريض السكري",
    ],
    gi_note: "الأطعمة منخفضة المؤشر الجلايسيمي (GI < 55) هي الأفضل لمريض السكري",
  },

  hypertension: {
    dash_diet: "نظام DASH هو الأفضل علمياً لخفض ضغط الدم",
    sodium: {
      max: "2300 ملغ صوديوم يومياً (ملعقة صغيرة ملح)",
      ideal: "1500 ملغ للمرضى ذوي الضغط العالي",
      sources: ["ملح الطعام", "المعلبات", "المخللات", "الأغذية المصنعة", "الوجبات السريعة", "الجبن المالح"],
    },
    recommended: [
      "الخضروات والفواكه: غنية بالبوتاسيوم الذي يخفض الضغط",
      "منتجات الألبان قليلة الدسم: غنية بالكالسيوم",
      "الأسماك الدهنية (سلمون، تونة): أوميغا 3 يفيد الأوعية الدموية",
      "الثوم: دراسات تشير لتأثيره الخافض للضغط",
      "الشوكولاتة الداكنة (70%+): فلافونويد تفيد الأوعية",
    ],
    avoid: [
      "الملح الزائد والأطعمة المملحة",
      "اللحوم المصنعة: نقانق، بيرغر، لانشون — عالية الصوديوم",
      "الكافيين الزائد: أكثر من 3 أكواب قهوة يومياً",
      "الوجبات السريعة",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// SECTION 6: EXERCISE RULES
// ─────────────────────────────────────────────────────────────

export const EXERCISE_RULES = {
  diabetes: {
    recommended: "150 دقيقة أسبوعياً من النشاط المعتدل (ADA 2024)",
    beforeExercise: [
      { sugarLevel: "< 100 mg/dL", action: "تناول 15-30 غرام كربوهيدرات قبل البدء" },
      { sugarLevel: "100-250 mg/dL", action: "آمن لممارسة الرياضة المعتدلة" },
      { sugarLevel: "> 250 mg/dL", action: "تجنب الرياضة الشاقة. تحقق من الكيتونات إذا النوع الأول" },
      { sugarLevel: "> 300 mg/dL", action: "لا تمارس رياضة حتى ينخفض السكر" },
    ],
    afterExercise: "راقب السكر — قد ينخفض بعد ساعات من التمرين (Delayed Hypoglycemia)",
    best: ["المشي", "السباحة", "ركوب الدراجة", "اليوغا", "تمارين المقاومة الخفيفة"],
  },
  hypertension: {
    recommended: "150 دقيقة نشاط هوائي معتدل أسبوعياً",
    avoid: [
      "رفع الأثقال الثقيلة مع حبس النفس (Valsalva maneuver) — يرفع الضغط فجأة",
      "التمارين الشاقة جداً إذا كان الضغط > 180/110 غير متحكم به",
    ],
    best: ["المشي السريع", "السباحة", "ركوب الدراجة", "الرقص", "الايروبيك الخفيف"],
    bp_response: "كل جلسة رياضة تخفض الضغط بـ 5-8 mmHg لعدة ساعات بعدها",
  },
};

// ─────────────────────────────────────────────────────────────
// SECTION 7: BOT RESPONSE RULES (Scientific Guardrails)
// ─────────────────────────────────────────────────────────────

export const BOT_RULES = {
  mustEscalate: [
    "أي قراءة سكر < 54 أو > 400",
    "أي قراءة ضغط > 180/120",
    "أعراض طوارئ من قائمة IMMEDIATE_EMERGENCY_SYMPTOMS",
    "ذكر ألم صدر + ضيق تنفس معاً",
    "ذكر شلل أو تنميل في وجه أو طرف",
    "صداع رعدي (الأشد في الحياة)",
  ],
  neverDo: [
    "لا تعطي تشخيصاً قاطعاً أبداً",
    "لا تقل للمريض أن يوقف دوائه",
    "لا تعطي جرعة دواء محددة بدون طبيب",
    "لا تطمئن مريضاً على أعراض خطيرة",
    "لا تستبدل الطبيب في القرارات العلاجية",
  ],
  alwaysDo: [
    "اذكر مراجعة الطبيب لأي حالة متوسطة أو خطيرة",
    "للطوارئ: اطلب الاتصال بالإسعاف فوراً",
    "أكد أن المعلومات توعوية وليست بديلاً عن الطبيب",
    "كن دافئاً وداعماً دائماً",
    "لغة عربية واضحة مبسطة دائماً",
  ],
  disclaimer: "⚠️ هذا المساعد توعوي فقط ولا يُغني عن استشارة الطبيب المختص",
};