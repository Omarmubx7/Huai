export interface Medication {
  id: string;
  name: string;
  arabicName: string;
  category: "diabetes" | "hypertension";
  dosages: string[];
  class?: string;
}

export const MEDICATIONS_DATABASE: Medication[] = [
  // ========== DIABETES MEDICATIONS ==========
  {
    id: "metformin",
    name: "Metformin",
    arabicName: "ميتفورمين",
    category: "diabetes",
    dosages: ["500mg", "850mg", "1000mg"],
    class: "Biguanide",
  },
  {
    id: "glibenclamide",
    name: "Glibenclamide",
    arabicName: "غليبنكلاميد",
    category: "diabetes",
    dosages: ["2.5mg", "5mg"],
    class: "Sulfonylurea",
  },
  {
    id: "glipizide",
    name: "Glipizide",
    arabicName: "جليبيزيد",
    category: "diabetes",
    dosages: ["5mg", "10mg"],
    class: "Sulfonylurea",
  },
  {
    id: "gliclazide",
    name: "Gliclazide",
    arabicName: "غليكلازيد",
    category: "diabetes",
    dosages: ["30mg", "60mg", "80mg"],
    class: "Sulfonylurea",
  },
  {
    id: "sitagliptin",
    name: "Sitagliptin",
    arabicName: "سيتاغليبتين",
    category: "diabetes",
    dosages: ["25mg", "50mg", "100mg"],
    class: "DPP-4 Inhibitor",
  },
  {
    id: "vildagliptin",
    name: "Vildagliptin",
    arabicName: "فيلداغليبتين",
    category: "diabetes",
    dosages: ["50mg"],
    class: "DPP-4 Inhibitor",
  },
  {
    id: "empagliflozin",
    name: "Empagliflozin",
    arabicName: "إمباغليفلوزين",
    category: "diabetes",
    dosages: ["10mg", "25mg"],
    class: "SGLT-2 Inhibitor",
  },
  {
    id: "dapagliflozin",
    name: "Dapagliflozin",
    arabicName: "داباغليفلوزين",
    category: "diabetes",
    dosages: ["5mg", "10mg"],
    class: "SGLT-2 Inhibitor",
  },
  {
    id: "canagliflozin",
    name: "Canagliflozin",
    arabicName: "كاناغليفلوزين",
    category: "diabetes",
    dosages: ["100mg", "300mg"],
    class: "SGLT-2 Inhibitor",
  },
  {
    id: "insulin-glargine",
    name: "Insulin Glargine",
    arabicName: "أنسولين غلارجين",
    category: "diabetes",
    dosages: ["Lantus", "Toujeo", "Basaglar"],
    class: "Long-acting Insulin",
  },
  {
    id: "insulin-detemir",
    name: "Insulin Detemir",
    arabicName: "أنسولين ديتيمير",
    category: "diabetes",
    dosages: ["Levemir"],
    class: "Long-acting Insulin",
  },
  {
    id: "insulin-aspart",
    name: "Insulin Aspart",
    arabicName: "أنسولين أسبارت",
    category: "diabetes",
    dosages: ["NovoRapid"],
    class: "Rapid-acting Insulin",
  },
  {
    id: "insulin-lispro",
    name: "Insulin Lispro",
    arabicName: "أنسولين ليسبرو",
    category: "diabetes",
    dosages: ["Humalog"],
    class: "Rapid-acting Insulin",
  },
  {
    id: "insulin-nph",
    name: "Insulin NPH",
    arabicName: "أنسولين NPH",
    category: "diabetes",
    dosages: ["Humulin N", "Novolin N"],
    class: "Intermediate-acting Insulin",
  },
  {
    id: "pioglitazone",
    name: "Pioglitazone",
    arabicName: "بيوغليتازون",
    category: "diabetes",
    dosages: ["15mg", "30mg", "45mg"],
    class: "Thiazolidinedione",
  },

  // ========== HYPERTENSION MEDICATIONS ==========
  {
    id: "amlodipine",
    name: "Amlodipine",
    arabicName: "أملوديبين",
    category: "hypertension",
    dosages: ["2.5mg", "5mg", "10mg"],
    class: "Calcium Channel Blocker",
  },
  {
    id: "nifedipine",
    name: "Nifedipine",
    arabicName: "نيفيديبين",
    category: "hypertension",
    dosages: ["30mg", "60mg", "90mg"],
    class: "Calcium Channel Blocker",
  },
  {
    id: "diltiazem",
    name: "Diltiazem",
    arabicName: "ديلتيازيم",
    category: "hypertension",
    dosages: ["60mg", "90mg", "120mg"],
    class: "Calcium Channel Blocker",
  },
  {
    id: "losartan",
    name: "Losartan",
    arabicName: "لوسارتان",
    category: "hypertension",
    dosages: ["25mg", "50mg", "100mg"],
    class: "ARB",
  },
  {
    id: "valsartan",
    name: "Valsartan",
    arabicName: "فالسارتان",
    category: "hypertension",
    dosages: ["40mg", "80mg", "160mg", "320mg"],
    class: "ARB",
  },
  {
    id: "irbesartan",
    name: "Irbesartan",
    arabicName: "إربيسارتان",
    category: "hypertension",
    dosages: ["75mg", "150mg", "300mg"],
    class: "ARB",
  },
  {
    id: "telmisartan",
    name: "Telmisartan",
    arabicName: "تيلميسارتان",
    category: "hypertension",
    dosages: ["20mg", "40mg", "80mg"],
    class: "ARB",
  },
  {
    id: "lisinopril",
    name: "Lisinopril",
    arabicName: "ليسينوبريل",
    category: "hypertension",
    dosages: ["2.5mg", "5mg", "10mg", "20mg"],
    class: "ACE Inhibitor",
  },
  {
    id: "enalapril",
    name: "Enalapril",
    arabicName: "إنالابريل",
    category: "hypertension",
    dosages: ["2.5mg", "5mg", "10mg", "20mg"],
    class: "ACE Inhibitor",
  },
  {
    id: "ramipril",
    name: "Ramipril",
    arabicName: "راميبريل",
    category: "hypertension",
    dosages: ["1.25mg", "2.5mg", "5mg", "10mg"],
    class: "ACE Inhibitor",
  },
  {
    id: "perindopril",
    name: "Perindopril",
    arabicName: "بيريندوبريل",
    category: "hypertension",
    dosages: ["2mg", "4mg", "8mg"],
    class: "ACE Inhibitor",
  },
  {
    id: "hydrochlorothiazide",
    name: "Hydrochlorothiazide",
    arabicName: "هيدروكلوروثيازيد",
    category: "hypertension",
    dosages: ["12.5mg", "25mg"],
    class: "Thiazide Diuretic",
  },
  {
    id: "furosemide",
    name: "Furosemide",
    arabicName: "فوروسيمايد",
    category: "hypertension",
    dosages: ["20mg", "40mg", "80mg"],
    class: "Loop Diuretic",
  },
  {
    id: "spironolactone",
    name: "Spironolactone",
    arabicName: "سبيرونولاكتون",
    category: "hypertension",
    dosages: ["25mg", "50mg", "100mg"],
    class: "Potassium-sparing Diuretic",
  },
  {
    id: "atenolol",
    name: "Atenolol",
    arabicName: "أتينولول",
    category: "hypertension",
    dosages: ["25mg", "50mg", "100mg"],
    class: "Beta Blocker",
  },
  {
    id: "metoprolol",
    name: "Metoprolol",
    arabicName: "ميتوبرولول",
    category: "hypertension",
    dosages: ["25mg", "50mg", "100mg"],
    class: "Beta Blocker",
  },
  {
    id: "bisoprolol",
    name: "Bisoprolol",
    arabicName: "بيسوبرولول",
    category: "hypertension",
    dosages: ["2.5mg", "5mg", "10mg"],
    class: "Beta Blocker",
  },
  {
    id: "carvedilol",
    name: "Carvedilol",
    arabicName: "كارفيديلول",
    category: "hypertension",
    dosages: ["3.125mg", "6.25mg", "12.5mg", "25mg"],
    class: "Beta Blocker",
  },
  {
    id: "nebivolol",
    name: "Nebivolol",
    arabicName: "نيبيفولول",
    category: "hypertension",
    dosages: ["2.5mg", "5mg", "10mg"],
    class: "Beta Blocker",
  },
  {
    id: "doxazosin",
    name: "Doxazosin",
    arabicName: "دوكسازوسين",
    category: "hypertension",
    dosages: ["1mg", "2mg", "4mg", "8mg"],
    class: "Alpha Blocker",
  },
];

export function searchMedications(query: string, category?: "diabetes" | "hypertension"): Medication[] {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return category
      ? MEDICATIONS_DATABASE.filter(m => m.category === category)
      : MEDICATIONS_DATABASE;
  }

  return MEDICATIONS_DATABASE.filter(med => {
    const matchesCategory = !category || med.category === category;
    const matchesSearch =
      med.arabicName.includes(lowerQuery) ||
      med.name.toLowerCase().includes(lowerQuery) ||
      med.dosages.some(d => d.toLowerCase().includes(lowerQuery));

    return matchesCategory && matchesSearch;
  });
}

export function getMedicationsByCategory(category: "diabetes" | "hypertension"): Medication[] {
  return MEDICATIONS_DATABASE.filter(m => m.category === category);
}

export function formatMedicationDisplay(med: Medication, dosage: string): string {
  return `${med.arabicName} ${dosage}`;
}
