// Le 404 de la boutique.
//
// Le fichier réel est un cran au-dessus, dans [locale]/. On le ré-expose ici
// pour une seule raison : Next.js remonte les segments jusqu'au premier
// not-found, et rend la page dans le layout de CE segment. Sans ce fichier, un
// 404 de la vitrine trouverait celui de [locale]/ et s'afficherait donc SANS
// l'habillage boutique — barre de navigation et pied de page envolés, alors
// que ce sont eux qui donnent au visiteur un chemin de sortie.
//
// Celui de [locale]/ continue de servir l'espace admin, où l'habillage
// boutique n'a rien à faire.
export { default } from "../not-found";
