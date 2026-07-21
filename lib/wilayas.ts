/**
 * Liste des 58 wilayas d'Algérie (depuis la réforme de 2019).
 * Tableau ordonné par code officiel.
 */

export type Wilaya = {
  /** Code numérique officiel (01-58). */
  code: string;
  nom: { fr: string; ar: string };
};

export const WILAYAS: Wilaya[] = [
  { code: "01", nom: { fr: "Adrar", ar: "أدرار" } },
  { code: "02", nom: { fr: "Chlef", ar: "الشلف" } },
  { code: "03", nom: { fr: "Laghouat", ar: "الأغواط" } },
  { code: "04", nom: { fr: "Oum El Bouaghi", ar: "أم البواقي" } },
  { code: "05", nom: { fr: "Batna", ar: "باتنة" } },
  { code: "06", nom: { fr: "Béjaïa", ar: "بجاية" } },
  { code: "07", nom: { fr: "Biskra", ar: "بسكرة" } },
  { code: "08", nom: { fr: "Béchar", ar: "بشار" } },
  { code: "09", nom: { fr: "Blida", ar: "البليدة" } },
  { code: "10", nom: { fr: "Bouira", ar: "البويرة" } },
  { code: "11", nom: { fr: "Tamanrasset", ar: "تمنراست" } },
  { code: "12", nom: { fr: "Tébessa", ar: "تبسة" } },
  { code: "13", nom: { fr: "Tlemcen", ar: "تلمسان" } },
  { code: "14", nom: { fr: "Tiaret", ar: "تيارت" } },
  { code: "15", nom: { fr: "Tizi Ouzou", ar: "تيزي وزو" } },
  { code: "16", nom: { fr: "Alger", ar: "الجزائر" } },
  { code: "17", nom: { fr: "Djelfa", ar: "الجلفة" } },
  { code: "18", nom: { fr: "Jijel", ar: "جيجل" } },
  { code: "19", nom: { fr: "Sétif", ar: "سطيف" } },
  { code: "20", nom: { fr: "Saïda", ar: "سعيدة" } },
  { code: "21", nom: { fr: "Skikda", ar: "سكيكدة" } },
  { code: "22", nom: { fr: "Sidi Bel Abbès", ar: "سيدي بلعباس" } },
  { code: "23", nom: { fr: "Annaba", ar: "عنابة" } },
  { code: "24", nom: { fr: "Guelma", ar: "قالمة" } },
  { code: "25", nom: { fr: "Constantine", ar: "قسنطينة" } },
  { code: "26", nom: { fr: "Médéa", ar: "المدية" } },
  { code: "27", nom: { fr: "Mostaganem", ar: "مستغانم" } },
  { code: "28", nom: { fr: "M'Sila", ar: "المسيلة" } },
  { code: "29", nom: { fr: "Mascara", ar: "معسكر" } },
  { code: "30", nom: { fr: "Ouargla", ar: "ورقلة" } },
  { code: "31", nom: { fr: "Oran", ar: "وهران" } },
  { code: "32", nom: { fr: "El Bayadh", ar: "البيض" } },
  { code: "33", nom: { fr: "Illizi", ar: "إيليزي" } },
  { code: "34", nom: { fr: "Bordj Bou Arréridj", ar: "برج بوعريريج" } },
  { code: "35", nom: { fr: "Boumerdès", ar: "بومرداس" } },
  { code: "36", nom: { fr: "El Tarf", ar: "الطارف" } },
  { code: "37", nom: { fr: "Tindouf", ar: "تندوف" } },
  { code: "38", nom: { fr: "Tissemsilt", ar: "تيسمسيلت" } },
  { code: "39", nom: { fr: "El Oued", ar: "الوادي" } },
  { code: "40", nom: { fr: "Khenchela", ar: "خنشلة" } },
  { code: "41", nom: { fr: "Souk Ahras", ar: "سوق أهراس" } },
  { code: "42", nom: { fr: "Tipaza", ar: "تيبازة" } },
  { code: "43", nom: { fr: "Mila", ar: "ميلة" } },
  { code: "44", nom: { fr: "Aïn Defla", ar: "عين الدفلى" } },
  { code: "45", nom: { fr: "Naâma", ar: "النعامة" } },
  { code: "46", nom: { fr: "Aïn Témouchent", ar: "عين تموشنت" } },
  { code: "47", nom: { fr: "Ghardaïa", ar: "غرداية" } },
  { code: "48", nom: { fr: "Relizane", ar: "غليزان" } },
  { code: "49", nom: { fr: "Timimoun", ar: "تيميمون" } },
  { code: "50", nom: { fr: "Bordj Badji Mokhtar", ar: "برج باجي مختار" } },
  { code: "51", nom: { fr: "Ouled Djellal", ar: "أولاد جلال" } },
  { code: "52", nom: { fr: "Béni Abbès", ar: "بني عباس" } },
  { code: "53", nom: { fr: "In Salah", ar: "عين صالح" } },
  { code: "54", nom: { fr: "In Guezzam", ar: "عين قزام" } },
  { code: "55", nom: { fr: "Touggourt", ar: "تقرت" } },
  { code: "56", nom: { fr: "Djanet", ar: "جانت" } },
  { code: "57", nom: { fr: "El M'Ghair", ar: "المغير" } },
  { code: "58", nom: { fr: "El Meniaa", ar: "المنيعة" } },
];

/** Vérifie qu'un code de wilaya existe bien dans la liste. */
export function estWilayaValide(code: string): boolean {
  return WILAYAS.some((w) => w.code === code);
}
