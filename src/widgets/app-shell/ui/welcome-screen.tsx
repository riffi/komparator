import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

type WelcomeScreenProps = {
  onClose: () => void;
  onCreateExperiment: () => void;
  onGoModels: () => void;
};

const steps = [
  {
    title: "Create an experiment",
    description: "Define one task you want to compare across several models.",
  },
  {
    title: "Generate results",
    description: "Copy the prepared prompt, send it to LLMs, and collect their HTML output.",
  },
  {
    title: "Attach each result to a model",
    description: "Use your own model list or the catalog, then save the returned HTML.",
  },
  {
    title: "Compare and rate",
    description: "Review outputs, compare them side by side, and assign ratings.",
  },
];

export function WelcomeScreen({ onClose, onCreateExperiment, onGoModels }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <section className="w-full max-w-6xl overflow-hidden rounded-2xl border border-border/80 bg-surface/60 shadow-panel">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="relative overflow-hidden px-6 py-8 md:px-8 md:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,141,239,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(94,194,105,0.12),transparent_32%)]" />
            <div className="relative max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-dim">Welcome</div>
              <h2 className="mt-3 font-mono text-3xl font-semibold tracking-[-0.05em] text-text">
                Start with a clean comparison workflow
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
                Komparator helps you keep prompt experiments structured. Save HTML results from different models,
                compare them visually, and rate what actually performs better.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={onCreateExperiment}>
                  Create experiment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={onGoModels}>
                  Open models
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Continue
                </Button>
              </div>
              <div className="mt-5 text-xs text-dim">
                This screen is shown only once on first launch.
              </div>
            </div>
          </div>

          <div className="border-t border-border/80 bg-code/70 px-6 py-8 md:px-8 xl:border-l xl:border-t-0">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-dim">How it works</div>
            <ol className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-border/80 bg-surface/50 px-4 py-4">
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
                    Step {index + 1}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-text">{step.title}</div>
                  <p className="mt-1 text-sm leading-6 text-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
