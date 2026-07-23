import {
  Clock,
  CheckCircle2,
  PhoneOff,
  Ban,
  XCircle,
  CalendarClock,
  Pencil,
  DoorClosed,
  PackageX,
  BellRing,
  Copy,
  type LucideIcon,
} from "lucide-react";
import type { EtatAppel } from "@/lib/types";

/**
 * Association icône + couleur pour chaque état d'appel.
 * Trois familles de couleur :
 *  - vert : le seul état "positif" (client confirmé)
 *  - amber : états "à suivre / en attente d'action"
 *  - rouge : états "problème / bloquant"
 *  - gris : états neutres (pas encore contacté, pas répondu, doublon)
 */
const CONFIG: Record<EtatAppel, { Icon: LucideIcon; color: string }> = {
  non_appele: { Icon: Clock, color: "text-gray-400" },
  confirme: { Icon: CheckCircle2, color: "text-green-600" },
  ne_repond_pas: { Icon: PhoneOff, color: "text-gray-500" },
  telephone_eteint: { Icon: PhoneOff, color: "text-gray-500" },
  injoignable: { Icon: PhoneOff, color: "text-red-500" },
  faux_numero: { Icon: Ban, color: "text-red-500" },
  annule_client: { Icon: XCircle, color: "text-red-500" },
  report_livraison: { Icon: CalendarClock, color: "text-amber-500" },
  demande_modification: { Icon: Pencil, color: "text-amber-500" },
  absent_livraison: { Icon: DoorClosed, color: "text-amber-500" },
  colis_refuse: { Icon: PackageX, color: "text-red-500" },
  attente_rappel: { Icon: BellRing, color: "text-amber-500" },
  doublon: { Icon: Copy, color: "text-gray-500" },
};

export default function IconeEtatAppel({
  etat,
  className = "h-4 w-4",
}: {
  etat: EtatAppel;
  className?: string;
}) {
  const { Icon, color } = CONFIG[etat];
  return <Icon className={`${color} ${className} shrink-0`} aria-hidden="true" />;
}
