import { ExperimentsHeader } from "@/widgets/experiments-list/ui/experiments-header";
import { ExperimentsFilters } from "@/widgets/experiments-list/ui/experiments-filters";
import { ExperimentsGrid } from "@/widgets/experiments-list/ui/experiments-grid";

export function ExperimentsPage() {
  return (
    <div className="space-y-6">
      <ExperimentsHeader />
      <ExperimentsFilters />
      <ExperimentsGrid />
    </div>
  );
}