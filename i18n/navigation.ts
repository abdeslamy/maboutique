import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// createNavigation génère des versions "locale-aware" des outils de navigation.
// Au lieu d'utiliser next/link et next/navigation directement, on utilise ces
// versions ici, qui ajoutent automatiquement la locale active dans les URLs.
//
// Exemple : <Link href="/produits"> sur une page /ar/... mène à /ar/produits.
//          (Avec next/link, il aurait pointé sur /produits, ce qui aurait été
//           re-redirigé vers /fr/produits par le proxy → perte de la langue.)
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
