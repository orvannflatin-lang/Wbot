import { PrivacyModule } from "@/components/dashboard/PrivacyModule";

const PrivacyPage = () => {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Confidentialité
        </h1>
        <p className="text-muted-foreground">
          Gérez votre visibilité et protégez vos données
        </p>
      </div>

      <PrivacyModule />
    </div>
  );
};

export default PrivacyPage;