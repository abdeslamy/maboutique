import { SqueletteDashboard } from "@/components/admin/SqueletteAdmin";

// S'applique au Dashboard, et sert de secours aux sous-routes qui n'ont pas
// leur propre loading.tsx (ex. /admin/configuration).
export default function Chargement() {
  return <SqueletteDashboard />;
}
