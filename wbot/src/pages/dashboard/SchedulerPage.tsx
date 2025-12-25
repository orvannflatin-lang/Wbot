import { SchedulerModule } from "@/components/dashboard/SchedulerModule";

const SchedulerPage = () => {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Scheduler
        </h1>
        <p className="text-muted-foreground">
          Programmez vos statuts et messages à l'avance
        </p>
      </div>

      <SchedulerModule />
    </div>
  );
};

export default SchedulerPage;