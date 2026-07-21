// ============================================================================
// Données du catalogue initial pour le SEED.
// ============================================================================
// Ce fichier n'est utilisé QUE par prisma/seed.ts.
// Au runtime, l'app lit ses produits depuis la base de données via Prisma.
// ============================================================================

import type { Produit } from "../lib/types";

export const PRODUITS_INITIAUX: Produit[] = [
  // ── Mode ────────────────────────────────────────────────────────────────
  {
    id: "tshirt-coton-blanc",
    nom: { fr: "T-shirt blanc en coton", ar: "تيشيرت قطني أبيض" },
    description: {
      fr: "T-shirt en coton 100% bio, coupe droite et col rond. Doux, respirant, parfait pour tous les jours.",
      ar: "تيشيرت من القطن العضوي بنسبة 100٪، بقصّة مستقيمة وياقة دائرية. ناعم، قابل للتنفس، ومثالي للاستعمال اليومي.",
    },
    prix: 2500,
    categorie: "mode",
    images: ["bg-slate-100", "bg-slate-200", "bg-zinc-100", "bg-neutral-100"],
    emoji: "👕",
  },
  {
    id: "sneakers-urbaines",
    nom: { fr: "Sneakers urbaines", ar: "حذاء رياضي عصري" },
    description: {
      fr: "Baskets confortables au design minimaliste, semelle souple. Idéales pour la ville et la marche quotidienne.",
      ar: "حذاء رياضي مريح بتصميم بسيط ونعل مرن. مناسب للاستعمال اليومي والمشي في المدينة.",
    },
    prix: 8900,
    categorie: "mode",
    images: ["bg-stone-200", "bg-stone-300", "bg-amber-100", "bg-stone-100"],
    emoji: "👟",
  },
  {
    id: "sac-toile",
    nom: { fr: "Sac à dos en toile", ar: "حقيبة ظهر قماشية" },
    description: {
      fr: "Sac à dos en toile robuste avec plusieurs compartiments. Convient pour les études, le travail et les sorties.",
      ar: "حقيبة ظهر متينة من القماش، تحتوي على عدّة جيوب. مناسبة للدراسة والعمل والتنقّل اليومي.",
    },
    prix: 4200,
    categorie: "mode",
    images: ["bg-amber-200", "bg-amber-300", "bg-orange-200", "bg-yellow-200"],
    emoji: "🎒",
  },

  // ── Électronique ───────────────────────────────────────────────────────
  {
    id: "ecouteurs-bluetooth",
    nom: { fr: "Écouteurs sans fil Bluetooth", ar: "سمّاعات لاسلكية بلوتوث" },
    description: {
      fr: "Écouteurs Bluetooth avec son clair et autonomie de 24 heures. Étui de charge compact inclus.",
      ar: "سمّاعات بلوتوث بجودة صوت ممتازة وعمر بطارية يصل إلى 24 ساعة. تشمل علبة شحن صغيرة الحجم.",
    },
    prix: 5600,
    categorie: "electronique",
    images: ["bg-neutral-800", "bg-neutral-700", "bg-zinc-800", "bg-slate-800"],
    emoji: "🎧",
  },
  {
    id: "chargeur-usb-c",
    nom: { fr: "Chargeur rapide USB-C 30W", ar: "شاحن سريع USB-C بقوة 30 واط" },
    description: {
      fr: "Chargeur compact à charge rapide compatible avec smartphones et tablettes. Câble USB-C inclus.",
      ar: "شاحن صغير الحجم بتقنية الشحن السريع، متوافق مع الهواتف الذكية واللوحات. يشمل كابل USB-C.",
    },
    prix: 1800,
    categorie: "electronique",
    images: ["bg-sky-100", "bg-sky-200", "bg-blue-100", "bg-cyan-100"],
    emoji: "🔌",
  },
  {
    id: "montre-connectee",
    nom: { fr: "Montre connectée sport", ar: "ساعة ذكية رياضية" },
    description: {
      fr: "Montre connectée avec capteurs cardio, suivi du sommeil et autonomie de 7 jours. Écran AMOLED.",
      ar: "ساعة ذكية مع مستشعرات لقياس النبض ومتابعة النوم، وعمر بطارية يمتد إلى 7 أيام. شاشة AMOLED.",
    },
    prix: 12500,
    categorie: "electronique",
    images: ["bg-slate-700", "bg-slate-800", "bg-zinc-700", "bg-gray-700"],
    emoji: "⌚",
  },

  // ── Maison & déco ──────────────────────────────────────────────────────
  {
    id: "bougie-parfumee",
    nom: { fr: "Bougie parfumée vanille", ar: "شمعة معطّرة برائحة الفانيليا" },
    description: {
      fr: "Bougie artisanale à la cire végétale, parfum vanille doux. Durée de combustion : 30 heures.",
      ar: "شمعة يدوية الصنع من الشمع النباتي، برائحة الفانيليا الهادئة. مدّة الاحتراق: 30 ساعة.",
    },
    prix: 1200,
    categorie: "maison",
    images: ["bg-rose-200", "bg-rose-300", "bg-pink-200", "bg-rose-100"],
    emoji: "🕯️",
  },
  {
    id: "tapis-berbere",
    nom: { fr: "Tapis berbère fait main", ar: "زربية أمازيغية مصنوعة يدويًا" },
    description: {
      fr: "Tapis traditionnel en laine naturelle, motifs berbères authentiques tissés à la main.",
      ar: "زربية تقليدية من الصوف الطبيعي بتصاميم أمازيغية أصيلة، منسوجة يدويًا بأيدي حِرَفِيَّات.",
    },
    prix: 9500,
    categorie: "maison",
    images: ["bg-orange-300", "bg-orange-400", "bg-amber-300", "bg-red-300"],
    emoji: "🧶",
  },
  {
    id: "lampe-chevet",
    nom: { fr: "Lampe de chevet en bois", ar: "مصباح طاولة خشبي" },
    description: {
      fr: "Lampe au design épuré en bois clair, abat-jour en lin. Lumière chaude et apaisante pour la chambre.",
      ar: "مصباح بتصميم بسيط من الخشب الفاتح، مع غطاء من الكتّان. يمنح إضاءة دافئة ومريحة للغرفة.",
    },
    prix: 3400,
    categorie: "maison",
    images: ["bg-yellow-100", "bg-yellow-200", "bg-amber-100", "bg-orange-100"],
    emoji: "💡",
  },
  {
    id: "carafe-verre",
    nom: { fr: "Carafe en verre soufflé", ar: "إبريق ماء من الزجاج المنفوخ" },
    description: {
      fr: "Carafe élégante en verre transparent, contenance 1,2 L. Parfaite pour servir eau ou jus à table.",
      ar: "إبريق أنيق من الزجاج الشفاف، يتّسع لـ 1.2 لتر. مثالي لتقديم الماء أو العصير على المائدة.",
    },
    prix: 2100,
    categorie: "maison",
    images: ["bg-cyan-100", "bg-cyan-200", "bg-sky-100", "bg-blue-100"],
    emoji: "🫗",
  },
];
