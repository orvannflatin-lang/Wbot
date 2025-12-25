import { ArchivesModule } from "@/components/dashboard/ArchivesModule";

const ArchivesPage = () => {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Archives
        </h1>
        <p className="text-muted-foreground">
          Vos médias sauvegardés dans le cloud
        </p>
      </div>

      <ArchivesModule />
    </div>
  );
};

export default ArchivesPage;