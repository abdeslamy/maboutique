import TestUploadClient from "@/components/TestUploadClient";

// Page de test pour vérifier que l'intégration Cloudinary marche.
// Protégée par la garde admin (voir app/[locale]/admin/layout.tsx).
// Elle sera supprimée une fois la vraie interface admin produits en place.
export default function TestUploadPage() {
  return <TestUploadClient />;
}
