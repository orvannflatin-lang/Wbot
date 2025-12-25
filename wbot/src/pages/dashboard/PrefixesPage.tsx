import { PrefixesModule } from "@/components/dashboard/PrefixesModule";

const PrefixesPage = () => {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Configuration des Préfixes
        </h1>
        <p className="text-muted-foreground">
          Personnalisez vos commandes de contrôle
        </p>
      </div>

      <PrefixesModule />
    </div>
  );
};

export default PrefixesPage;