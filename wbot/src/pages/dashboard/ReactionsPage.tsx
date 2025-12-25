import { ReactionsModule } from "@/components/dashboard/ReactionsModule";

const ReactionsPage = () => {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Réactions automatiques
        </h1>
        <p className="text-muted-foreground">
          Configurez les réactions automatiques aux statuts
        </p>
      </div>

      <ReactionsModule />
    </div>
  );
};

export default ReactionsPage;