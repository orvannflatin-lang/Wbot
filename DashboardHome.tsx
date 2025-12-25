import { ConnectionModule } from "@/components/dashboard/ConnectionModule";

const DashboardHome = () => {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Connectez votre WhatsApp pour commencer
        </p>
      </div>

      <ConnectionModule />
    </div>
  );
};

export default DashboardHome;