// ============================================================================
// Catalogue des catégories proposées à l'admin (aucune dépendance à Prisma,
// donc importable côté client).
// ============================================================================
//
// Pourquoi une liste fermée plutôt qu'un champ libre :
//  - la boutique est BILINGUE ; laisser saisir « Beauté » obligerait l'admin
//    à fournir aussi la traduction arabe, et une erreur de traduction est
//    invisible pour qui ne lit pas la langue ;
//  - la saisie libre produit des doublons (« Électronique », « electronique »,
//    « High-tech ») qui fragmentent les filtres ;
//  - le slug sert d'identifiant en base : il doit rester stable et propre.
//
// La liste est volontairement large pour couvrir la majorité des boutiques.
// ============================================================================

export type CategorieCatalogue = {
  /** Slug stable, stocké en base et utilisé dans les URLs. */
  id: string;
  nomFr: string;
  nomAr: string;
};

export const CATALOGUE_CATEGORIES: CategorieCatalogue[] = [
  { id: "mode", nomFr: "Mode", nomAr: "موضة" },
  { id: "vetements-femme", nomFr: "Vêtements femme", nomAr: "ملابس نسائية" },
  { id: "vetements-homme", nomFr: "Vêtements homme", nomAr: "ملابس رجالية" },
  { id: "enfants-bebe", nomFr: "Enfants & bébé", nomAr: "أطفال ورضّع" },
  { id: "chaussures", nomFr: "Chaussures", nomAr: "أحذية" },
  { id: "sacs-bagages", nomFr: "Sacs & bagages", nomAr: "حقائب وأمتعة" },
  { id: "montres-bijoux", nomFr: "Montres & bijoux", nomAr: "ساعات ومجوهرات" },
  { id: "electronique", nomFr: "Électronique", nomAr: "إلكترونيات" },
  { id: "telephonie", nomFr: "Téléphonie", nomAr: "هواتف" },
  { id: "informatique", nomFr: "Informatique", nomAr: "إعلام آلي" },
  { id: "audio", nomFr: "Audio & son", nomAr: "صوتيات" },
  { id: "photo-video", nomFr: "Photo & vidéo", nomAr: "تصوير وفيديو" },
  { id: "jeux-video", nomFr: "Jeux vidéo", nomAr: "ألعاب فيديو" },
  { id: "electromenager", nomFr: "Électroménager", nomAr: "أجهزة منزلية" },
  { id: "maison", nomFr: "Maison & déco", nomAr: "منزل ودكور" },
  { id: "cuisine", nomFr: "Cuisine & arts de la table", nomAr: "مطبخ وأدوات المائدة" },
  { id: "meubles", nomFr: "Meubles", nomAr: "أثاث" },
  { id: "literie", nomFr: "Literie & linge de maison", nomAr: "فراش ومفروشات" },
  { id: "jardin", nomFr: "Jardin & extérieur", nomAr: "حديقة وفضاء خارجي" },
  { id: "bricolage", nomFr: "Bricolage & outillage", nomAr: "أشغال وعدّة" },
  { id: "beaute", nomFr: "Beauté & soins", nomAr: "تجميل وعناية" },
  { id: "parfums", nomFr: "Parfums", nomAr: "عطور" },
  { id: "sante-bienetre", nomFr: "Santé & bien-être", nomAr: "صحّة وعافية" },
  { id: "sport-fitness", nomFr: "Sport & fitness", nomAr: "رياضة ولياقة" },
  { id: "camping", nomFr: "Camping & plein air", nomAr: "تخييم وهواء طلق" },
  { id: "auto-moto", nomFr: "Auto & moto", nomAr: "سيارات ودرّاجات" },
  { id: "jouets", nomFr: "Jouets & jeux", nomAr: "ألعاب" },
  { id: "papeterie", nomFr: "Papeterie & bureau", nomAr: "قرطاسية ومكتب" },
  { id: "livres", nomFr: "Livres & culture", nomAr: "كتب وثقافة" },
  { id: "alimentation", nomFr: "Alimentation & épicerie", nomAr: "أغذية وبقالة" },
  { id: "animalerie", nomFr: "Animalerie", nomAr: "مستلزمات الحيوانات" },
  { id: "bebe-puericulture", nomFr: "Puériculture", nomAr: "مستلزمات الرضّع" },
  { id: "musique", nomFr: "Instruments de musique", nomAr: "آلات موسيقية" },
  { id: "art-loisirs", nomFr: "Art & loisirs créatifs", nomAr: "فنون وأشغال يدوية" },
  { id: "traditionnel", nomFr: "Artisanat traditionnel", nomAr: "صناعة تقليدية" },
  { id: "religieux", nomFr: "Articles religieux", nomAr: "مستلزمات دينية" },
  { id: "fournitures-pro", nomFr: "Fournitures professionnelles", nomAr: "لوازم مهنية" },
  { id: "cadeaux", nomFr: "Cadeaux & fêtes", nomAr: "هدايا ومناسبات" },
];
