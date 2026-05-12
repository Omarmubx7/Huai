// Derived from medical-rules-1.ts — ADA 2024, AHA/ACC 2025, WHO

export interface StatusResult {
  label: string;
  color: string;
  chipColor: "default" | "success" | "warning" | "error" | "info";
  severity: string;
  action: string;
}

// ── Blood Sugar (general reading, unknown timing) ──
export function getDiabetesStatus(value: number): StatusResult {
  if (value <= 53) return {
    label: "انخفاض حاد — طوارئ فورية 🚨",
    color: "#dc2626", chipColor: "error", severity: "emergency",
    action: "اتصل بالإسعاف فوراً. هذا مستوى خطير جداً يمكن أن يسبب فقدان الوعي.",
  };
  if (value <= 69) return {
    label: "منخفض — تدخل فوري ⬇️",
    color: "#3b82f6", chipColor: "info", severity: "danger",
    action: "تناول 15 غرام كربوهيدرات سريعة الآن (4 أقراص غلوكوز، أو نصف كوب عصير برتقال). أعد القياس بعد 15 دقيقة.",
  };
  if (value <= 99) return {
    label: "طبيعي صائماً ✅",
    color: "#22c55e", chipColor: "success", severity: "normal",
    action: "قراءة ممتازة. استمر في نمط حياتك الصحي.",
  };
  if (value <= 125) return {
    label: "ما قبل السكري ⚠️",
    color: "#f59e0b", chipColor: "warning", severity: "warning",
    action: "تحتاج مراجعة طبيب وتغيير نمط الحياة. هذا المستوى قابل للعكس بالنظام الغذائي والرياضة.",
  };
  if (value <= 139) return {
    label: "مرتفع قليلاً 🔸",
    color: "#f97316", chipColor: "warning", severity: "warning",
    action: "تجنب السكريات والنشويات البيضاء. شرب الماء يساعد. راجع طبيبك لتعديل الجرعة إذا لزم.",
  };
  if (value <= 179) return {
    label: "مرتفع ⚠️",
    color: "#f59e0b", chipColor: "warning", severity: "warning",
    action: "تجنب الأكل السكري. المشي الخفيف 15 دقيقة قد يساعد. راجع طبيبك إذا تكرر هذا المستوى.",
  };
  if (value <= 249) return {
    label: "مرتفع جداً 🔴",
    color: "#ef4444", chipColor: "error", severity: "danger",
    action: "اشرب ماء كثيراً. لا تمارس رياضة شاقة. راجع الطبيب اليوم لتعديل العلاج.",
  };
  if (value <= 299) return {
    label: "خطير — راجع الطبيب 🔴",
    color: "#dc2626", chipColor: "error", severity: "critical",
    action: "تحقق من وجود كيتونات في البول إذا أمكن. اشرب ماء. راجع الطبيب أو الطوارئ فوراً.",
  };
  if (value <= 399) return {
    label: "خطير جداً 🚨",
    color: "#dc2626", chipColor: "error", severity: "critical",
    action: "اذهب للطوارئ الآن. هذا المستوى يمكن أن يسبب الحماض الكيتوني السكري (DKA).",
  };
  return {
    label: "طارئ طبي 🚨",
    color: "#7f1d1d", chipColor: "error", severity: "emergency",
    action: "اتصل بالإسعاف فوراً. لا تنتظر. هذا مستوى طارئ قد يكون مهدداً للحياة.",
  };
}

// ── Blood Pressure (AHA/ACC 2025 — uses whichever dimension is higher category) ──
// getCategory logic from the rules file
export function getBPCategory(sys: number, dia: number): string {
  if (sys > 180 || dia > 120) return "emergency";
  if (sys >= 140 || dia >= 90)  return "stage2";
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return "stage1";
  if (sys >= 120 && sys <= 129 && dia < 80) return "elevated";
  if (sys >= 90 && sys < 120 && dia >= 60 && dia < 80) return "normal";
  return "low";
}

export function getBPStatus(sys: number, dia: number): StatusResult {
  const cat = getBPCategory(sys, dia);
  switch (cat) {
    case "emergency": return {
      label: "أزمة ضغط — طوارئ فورية 🚨",
      color: "#dc2626", chipColor: "error", severity: "emergency",
      action: "اتصل بالإسعاف فوراً. اجلس وارتاح. لا تأخذ دواء إضافي بدون توجيه طبي.",
    };
    case "stage2": return {
      label: "ارتفاع ضغط — المرحلة الثانية 🔴",
      color: "#ef4444", chipColor: "error", severity: "danger",
      action: "راجع الطبيب قريباً. على الأغلب يحتاج دوائين أو أكثر. تجنب المجهود الشديد.",
    };
    case "stage1": return {
      label: "ارتفاع ضغط — المرحلة الأولى ⚠️",
      color: "#f97316", chipColor: "warning", severity: "warning",
      action: "تغيير نمط الحياة ضروري: تقليل الملح، رياضة، خفض الوزن. قد يحتاج الطبيب بدء دواء.",
    };
    case "elevated": return {
      label: "مرتفع قليلاً ⚠️",
      color: "#f59e0b", chipColor: "warning", severity: "warning",
      action: "تجنب الملح الزائد والتوتر. ممارسة الرياضة تساعد. راجع طبيبك لمتابعة دورية.",
    };
    case "normal": return {
      label: "طبيعي ✅",
      color: "#22c55e", chipColor: "success", severity: "normal",
      action: "قراءة ممتازة. حافظ على نمط حياتك الصحي.",
    };
    default: return {
      label: "منخفض — انخفاض الضغط",
      color: "#60a5fa", chipColor: "info", severity: "warning",
      action: "اشرب سوائل وماء. إذا شعرت بدوخة أو إغماء اجلس فوراً. راجع الطبيب إذا تكرر.",
    };
  }
}
