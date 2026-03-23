import {
  CategoryRecord,
  ExperimentListItem,
  ExperimentRecord,
  ExperimentWorkspace,
  ModelRecord,
  PromptVersionRecord,
  ProviderRecord,
  ResultRecord,
  WorkspaceResultItem,
  WrapperRecord,
} from "@/entities/experiment/model/types";

export const seedCategories = [
  { id: "all", name: "All", color: "#5b8def", count: 12 },
  { id: "ui", name: "UI Components", color: "#60a5fa", count: 4 },
  { id: "landing", name: "Landing Pages", color: "#e87461", count: 3 },
  { id: "data", name: "Data Viz", color: "#4ade80", count: 2 },
  { id: "form", name: "Forms", color: "#a78bfa", count: 2 },
  { id: "email", name: "Email Templates", color: "#facc15", count: 1 },
] as const;

export const seedCategoriesRecords: CategoryRecord[] = [
  {
    id: "ui",
    name: "UI Components",
    description: "Reusable interface fragments and layouts.",
    color: "#60a5fa",
    sortOrder: 1,
    createdAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "landing",
    name: "Landing Pages",
    description: "Marketing and hero-section experiments.",
    color: "#e87461",
    sortOrder: 2,
    createdAt: "2026-01-01T09:10:00.000Z",
  },
  {
    id: "data",
    name: "Data Viz",
    description: "Charts and analytical layouts.",
    color: "#4ade80",
    sortOrder: 3,
    createdAt: "2026-01-01T09:20:00.000Z",
  },
  {
    id: "form",
    name: "Forms",
    description: "Input-heavy and validation scenarios.",
    color: "#a78bfa",
    sortOrder: 4,
    createdAt: "2026-01-01T09:30:00.000Z",
  },
  {
    id: "email",
    name: "Email Templates",
    description: "Transactional email rendering tests.",
    color: "#facc15",
    sortOrder: 5,
    createdAt: "2026-01-01T09:40:00.000Z",
  },
];

export const seedWrapperRecords: WrapperRecord[] = [
  {
    id: "standard-html",
    name: "Standard HTML",
    template:
      "Respond with a single self-contained HTML file. All CSS and JS inline. No external dependencies.\n\nTask:\n{{prompt}}",
    isDefault: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "component-mode",
    name: "Component Only",
    template:
      "Return only the component markup with inline styles. No html/body wrapper.\n\nTask:\n{{prompt}}",
    isDefault: false,
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-03-10T10:00:00.000Z",
  },
];

export const seedExperimentRecords: ExperimentRecord[] = [
  {
    id: "dashboard-widget-comparison",
    title: "Dashboard Widget Comparison",
    description:
      "Compare how different LLMs generate a responsive analytics dashboard card with chart integration and real-time data display.",
    status: "active",
    categoryId: "ui",
    wrapperId: "standard-html",
    tags: ["dashboard", "charts", "responsive"],
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-03-23T08:00:00.000Z",
  },
  {
    id: "saas-hero-section-variants",
    title: "SaaS Hero Section Variants",
    description:
      "Testing hero section generation with gradient backgrounds, CTA placement, and animated illustrations across models.",
    status: "active",
    categoryId: "landing",
    wrapperId: "standard-html",
    tags: ["hero", "saas", "animation"],
    createdAt: "2026-01-12T10:00:00.000Z",
    updatedAt: "2026-03-23T05:00:00.000Z",
  },
  {
    id: "interactive-chart-rendering",
    title: "Interactive Chart Rendering",
    description:
      "Evaluating Chart.js vs D3 code generation quality across Claude, GPT-4, and Gemini for complex multi-series datasets.",
    status: "completed",
    categoryId: "data",
    wrapperId: "standard-html",
    tags: ["chart.js", "d3", "interactive"],
    createdAt: "2025-12-28T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "multi-step-form-wizard",
    title: "Multi-Step Form Wizard",
    description:
      "How well can LLMs build accessible multi-step form wizards with validation, progress indicators, and error handling?",
    status: "draft",
    categoryId: "form",
    wrapperId: "component-mode",
    tags: ["forms", "a11y", "validation"],
    createdAt: "2026-01-20T10:00:00.000Z",
    updatedAt: "2026-03-22T10:00:00.000Z",
  },
  {
    id: "transactional-email-layouts",
    title: "Transactional Email Layouts",
    description:
      "Comparing LLM-generated HTML email templates for order confirmations, password resets, and onboarding sequences.",
    status: "active",
    categoryId: "email",
    wrapperId: "standard-html",
    tags: ["email", "html-email", "transactional"],
    createdAt: "2026-01-08T10:00:00.000Z",
    updatedAt: "2026-03-23T01:00:00.000Z",
  },
  {
    id: "pricing-page-showdown",
    title: "Pricing Page Showdown",
    description:
      "Full pricing page with toggle, feature comparison table, and FAQ accordion tested across five models.",
    status: "completed",
    categoryId: "landing",
    wrapperId: "standard-html",
    tags: ["pricing", "toggle", "comparison"],
    createdAt: "2025-12-15T10:00:00.000Z",
    updatedAt: "2026-03-16T10:00:00.000Z",
  },
];

export const seedProviderRecords: ProviderRecord[] = [
  { id: "anthropic", name: "Anthropic", color: "#e8755a", isActive: true, createdAt: "2026-01-01T11:00:00.000Z" },
  { id: "openai", name: "OpenAI", color: "#5ec269", isActive: true, createdAt: "2026-01-01T11:00:00.000Z" },
  { id: "google", name: "Google", color: "#4a9eed", isActive: true, createdAt: "2026-01-01T11:00:00.000Z" },
  { id: "meta", name: "Meta", color: "#a578e6", isActive: true, createdAt: "2026-01-01T11:00:00.000Z" },
  { id: "xai", name: "xAI", color: "#9a9ca0", isActive: true, createdAt: "2026-01-01T11:00:00.000Z" },
];

export const seedModelRecords: ModelRecord[] = [
  { id: "claude-3-5-sonnet", providerId: "anthropic", name: "Claude", version: "3.5 Sonnet", comment: "clean glassmorphism", isActive: true, createdAt: "2026-01-03T10:00:00.000Z" },
  { id: "gpt-4o", providerId: "openai", name: "GPT", version: "4o", comment: "balanced output", isActive: true, createdAt: "2026-01-03T10:00:00.000Z" },
  { id: "gemini-1-5-pro", providerId: "google", name: "Gemini", version: "1.5 Pro", comment: "interesting layout", isActive: true, createdAt: "2026-01-03T10:00:00.000Z" },
  { id: "llama-3-1-405b", providerId: "meta", name: "Llama", version: "3.1 405B", comment: "missed styling", isActive: true, createdAt: "2026-01-03T10:00:00.000Z" },
  { id: "grok-2", providerId: "xai", name: "Grok", version: "2", comment: "basic structure", isActive: true, createdAt: "2026-01-03T10:00:00.000Z" },
];

export const seedPromptVersionRecords: PromptVersionRecord[] = [
  {
    id: "pv-dashboard-1",
    experimentId: "dashboard-widget-comparison",
    versionNumber: 1,
    promptText: "Create a compact analytics card with KPI, sparkline and comparison delta.",
    changeNote: "Initial dashboard card brief.",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "pv-dashboard-2",
    experimentId: "dashboard-widget-comparison",
    versionNumber: 2,
    promptText: "Create a responsive analytics card with KPI, sparkline, comparison delta and subtle hover states.",
    changeNote: "Added responsive requirement and hover behavior.",
    createdAt: "2026-02-10T10:00:00.000Z",
  },
  {
    id: "pv-dashboard-3",
    experimentId: "dashboard-widget-comparison",
    versionNumber: 3,
    promptText: "Create a responsive analytics dashboard widget with KPI, sparkline, comparison delta, segmented trend pills and dark theme visual polish.",
    changeNote: "Specified dark theme, denser layout and trend pills.",
    createdAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "pv-hero-1",
    experimentId: "saas-hero-section-variants",
    versionNumber: 1,
    promptText: "Create a dark SaaS hero section with glassmorphism effects and strong CTA hierarchy.",
    changeNote: "Initial hero brief.",
    createdAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "pv-hero-2",
    experimentId: "saas-hero-section-variants",
    versionNumber: 2,
    promptText: "Create a dark SaaS hero section with glassmorphism, animated accents and conversion-focused CTA hierarchy.",
    changeNote: "Added animated accents and stronger CTA constraints.",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
];

const dashboardHtmlA = `<!DOCTYPE html>
<html>
<head>
<style>
body{margin:0;font-family:Inter,system-ui;background:#0f172a;color:#e2e8f0;padding:20px}
.card{background:linear-gradient(180deg,#111827,#0f172a);border:1px solid rgba(148,163,184,.14);border-radius:18px;padding:20px;max-width:420px;box-shadow:0 20px 45px rgba(15,23,42,.45)}
.kpi{font-size:40px;font-weight:800;letter-spacing:-.04em}
.row{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
.badge{padding:6px 10px;border-radius:999px;background:rgba(16,185,129,.15);color:#34d399;font-size:12px;font-weight:700}
.spark{height:80px;margin-top:18px;border-radius:12px;background:linear-gradient(180deg,rgba(59,130,246,.25),rgba(15,23,42,0));position:relative;overflow:hidden}
.spark:before{content:'';position:absolute;inset:18px 14px 12px;background:linear-gradient(90deg,#38bdf8,#60a5fa,#22c55e);clip-path:path('M0 40 C30 18, 60 48, 90 20 S150 10, 180 26 S240 46, 280 8');height:54px}
</style>
</head>
<body><div class='card'><div style='color:#94a3b8;font-size:13px'>Weekly revenue</div><div class='row'><div class='kpi'>$82.4k</div><div class='badge'>+14.2%</div></div><div style='margin-top:10px;color:#94a3b8;font-size:13px'>vs previous week</div><div class='spark'></div></div></body>
</html>`;

const dashboardHtmlB = `<!DOCTYPE html>
<html>
<head>
<style>
body{margin:0;background:#111827;color:#f8fafc;font-family:system-ui;padding:18px}.wrap{max-width:420px;background:#0f172a;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px}.top{display:flex;justify-content:space-between;align-items:flex-start}.value{font-size:38px;font-weight:800}.delta{color:#4ade80;font-size:13px;font-weight:700}.bars{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;align-items:end;height:96px;margin-top:18px}.bar{background:linear-gradient(180deg,#60a5fa,#1d4ed8);border-radius:999px}</style>
</head>
<body><div class='wrap'><div class='top'><div><div style='font-size:13px;color:#94a3b8'>Conversion rate</div><div class='value'>6.8%</div></div><div class='delta'>up 0.9%</div></div><div class='bars'><div class='bar' style='height:42%'></div><div class='bar' style='height:61%'></div><div class='bar' style='height:55%'></div><div class='bar' style='height:78%'></div><div class='bar' style='height:72%'></div><div class='bar' style='height:89%'></div><div class='bar' style='height:96%'></div></div></div></body>
</html>`;

const dashboardHtmlC = `<!DOCTYPE html>
<html>
<head>
<style>
body{margin:0;background:#09090b;color:#fafafa;font-family:system-ui;padding:20px}.card{max-width:420px;border-radius:20px;padding:20px;background:radial-gradient(circle at top right,rgba(91,141,239,.25),transparent 25%),#111827;border:1px solid rgba(255,255,255,.08)}.title{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#71717a}.value{font-size:42px;font-weight:900;margin-top:12px}.chips{display:flex;gap:8px;margin-top:14px}.chip{background:#18181b;border:1px solid rgba(255,255,255,.08);padding:6px 10px;border-radius:999px;font-size:12px;color:#a1a1aa}.line{margin-top:22px;height:88px;border-radius:14px;background:linear-gradient(180deg,rgba(37,99,235,.2),rgba(9,9,11,0));position:relative}.line svg{position:absolute;inset:0}</style>
</head>
<body><div class='card'><div class='title'>Net new users</div><div class='value'>1,284</div><div style='margin-top:8px;color:#a1a1aa'>Dark compact widget with quick scan affordances</div><div class='chips'><div class='chip'>+12.8%</div><div class='chip'>7 day trend</div><div class='chip'>mobile-ready</div></div><div class='line'><svg viewBox='0 0 320 88' fill='none'><path d='M8 60C40 40 68 44 96 30C124 16 146 22 176 18C206 14 232 34 262 22C284 14 298 16 312 10' stroke='#60a5fa' stroke-width='4' stroke-linecap='round'/></svg></div></div></body>
</html>`;

export const seedResultRecords: ResultRecord[] = [
  {
    id: "r-dashboard-claude-v3",
    promptVersionId: "pv-dashboard-3",
    modelId: "claude-3-5-sonnet",
    attempt: 1,
    htmlContent: dashboardHtmlA,
    rating: 9,
    notes: "Best visual hierarchy and strongest density-to-readability balance.",
    fileSizeBytes: 2481,
    lineCount: 14,
    createdAt: "2026-03-23T06:10:00.000Z",
  },
  {
    id: "r-dashboard-gpt-v3",
    promptVersionId: "pv-dashboard-3",
    modelId: "gpt-4o",
    attempt: 1,
    htmlContent: dashboardHtmlB,
    rating: 7,
    notes: "Clean structure, but the chart area feels generic compared to Claude.",
    fileSizeBytes: 2113,
    lineCount: 8,
    createdAt: "2026-03-23T06:20:00.000Z",
  },
  {
    id: "r-dashboard-gemini-v3",
    promptVersionId: "pv-dashboard-3",
    modelId: "gemini-1-5-pro",
    attempt: 1,
    htmlContent: dashboardHtmlC,
    rating: 8,
    notes: "Good atmosphere and chip system, slightly weaker data legibility.",
    fileSizeBytes: 2324,
    lineCount: 9,
    createdAt: "2026-03-23T06:35:00.000Z",
  },
  {
    id: "r-dashboard-gpt-v2",
    promptVersionId: "pv-dashboard-2",
    modelId: "gpt-4o",
    attempt: 1,
    htmlContent: dashboardHtmlB,
    rating: 6,
    notes: "Earlier prompt version before density constraints were added.",
    fileSizeBytes: 2113,
    lineCount: 8,
    createdAt: "2026-02-11T07:10:00.000Z",
  },
  {
    id: "r-hero-claude-v2",
    promptVersionId: "pv-hero-2",
    modelId: "claude-3-5-sonnet",
    attempt: 1,
    htmlContent: dashboardHtmlA,
    rating: 8,
    notes: "Placeholder hero record for non-detail pages.",
    fileSizeBytes: 2400,
    lineCount: 14,
    createdAt: "2026-03-05T07:10:00.000Z",
  },
];

export const seedExperiments: ExperimentListItem[] = [
  {
    id: "dashboard-widget-comparison",
    title: "Dashboard Widget Comparison",
    description:
      "Compare how different LLMs generate a responsive analytics dashboard card with chart integration and real-time data display.",
    status: "active",
    categoryId: "ui",
    categoryName: "UI Components",
    categoryColor: "#60a5fa",
    tags: ["dashboard", "charts", "responsive"],
    promptCount: 3,
    resultCount: 8,
    avgRating: 7.4,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-03-23T08:00:00.000Z",
    createdLabel: "Jan 15, 2026",
    updatedLabel: "2 hours ago",
  },
  {
    id: "saas-hero-section-variants",
    title: "SaaS Hero Section Variants",
    description:
      "Testing hero section generation with gradient backgrounds, CTA placement, and animated illustrations across models.",
    status: "active",
    categoryId: "landing",
    categoryName: "Landing Pages",
    categoryColor: "#e87461",
    tags: ["hero", "saas", "animation"],
    promptCount: 2,
    resultCount: 10,
    avgRating: 8.1,
    createdAt: "2026-01-12T10:00:00.000Z",
    updatedAt: "2026-03-23T05:00:00.000Z",
    createdLabel: "Jan 12, 2026",
    updatedLabel: "5 hours ago",
  },
  {
    id: "interactive-chart-rendering",
    title: "Interactive Chart Rendering",
    description:
      "Evaluating Chart.js vs D3 code generation quality across Claude, GPT-4, and Gemini for complex multi-series datasets.",
    status: "completed",
    categoryId: "data",
    categoryName: "Data Viz",
    categoryColor: "#4ade80",
    tags: ["chart.js", "d3", "interactive"],
    promptCount: 4,
    resultCount: 12,
    avgRating: 8.6,
    createdAt: "2025-12-28T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
    createdLabel: "Dec 28, 2025",
    updatedLabel: "3 days ago",
  },
  {
    id: "multi-step-form-wizard",
    title: "Multi-Step Form Wizard",
    description:
      "How well can LLMs build accessible multi-step form wizards with validation, progress indicators, and error handling?",
    status: "draft",
    categoryId: "form",
    categoryName: "Forms",
    categoryColor: "#a78bfa",
    tags: ["forms", "a11y", "validation"],
    promptCount: 1,
    resultCount: 0,
    avgRating: null,
    createdAt: "2026-01-20T10:00:00.000Z",
    updatedAt: "2026-03-22T10:00:00.000Z",
    createdLabel: "Jan 20, 2026",
    updatedLabel: "1 day ago",
  },
  {
    id: "transactional-email-layouts",
    title: "Transactional Email Layouts",
    description:
      "Comparing LLM-generated HTML email templates for order confirmations, password resets, and onboarding sequences.",
    status: "active",
    categoryId: "email",
    categoryName: "Email Templates",
    categoryColor: "#facc15",
    tags: ["email", "html-email", "transactional"],
    promptCount: 2,
    resultCount: 6,
    avgRating: 5.8,
    createdAt: "2026-01-08T10:00:00.000Z",
    updatedAt: "2026-03-23T01:00:00.000Z",
    createdLabel: "Jan 8, 2026",
    updatedLabel: "12 hours ago",
  },
  {
    id: "pricing-page-showdown",
    title: "Pricing Page Showdown",
    description:
      "Full pricing page with toggle, feature comparison table, and FAQ accordion tested across five models.",
    status: "completed",
    categoryId: "landing",
    categoryName: "Landing Pages",
    categoryColor: "#e87461",
    tags: ["pricing", "toggle", "comparison"],
    promptCount: 2,
    resultCount: 10,
    avgRating: 7.9,
    createdAt: "2025-12-15T10:00:00.000Z",
    updatedAt: "2026-03-16T10:00:00.000Z",
    createdLabel: "Dec 15, 2025",
    updatedLabel: "1 week ago",
  },
];

export function getExperimentWorkspace(experimentId: string): ExperimentWorkspace | null {
  const experiment = seedExperimentRecords.find((item) => item.id === experimentId);

  if (!experiment) {
    return null;
  }

  const category = seedCategoriesRecords.find((item) => item.id === experiment.categoryId);
  const wrapper = seedWrapperRecords.find((item) => item.id === experiment.wrapperId);
  const promptVersions = seedPromptVersionRecords
    .filter((item) => item.experimentId === experiment.id)
    .sort((left, right) => right.versionNumber - left.versionNumber);

  const results: WorkspaceResultItem[] = seedResultRecords
    .filter((item) => promptVersions.some((version) => version.id === item.promptVersionId))
    .map((result) => {
      const model = seedModelRecords.find((item) => item.id === result.modelId)!;
      const provider = seedProviderRecords.find((item) => item.id === model.providerId)!;
      const promptVersion = promptVersions.find((item) => item.id === result.promptVersionId)!;

      return {
        id: result.id,
        modelId: model.id,
        providerName: provider.name,
        providerColor: provider.color,
        modelName: model.name,
        modelVersion: model.version,
        modelComment: model.comment,
        promptVersionNumber: promptVersion.versionNumber,
        attempt: result.attempt,
        rating: result.rating,
        notes: result.notes,
        htmlContent: result.htmlContent,
        fileSizeBytes: result.fileSizeBytes,
        lineCount: result.lineCount,
        createdAt: result.createdAt,
        createdLabel: new Date(result.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })
    .sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0));

  return {
    id: experiment.id,
    title: experiment.title,
    description: experiment.description,
    status: experiment.status,
    categoryName: category?.name ?? "Unknown",
    categoryColor: category?.color ?? "#71717a",
    tags: experiment.tags,
    wrapperName: wrapper?.name ?? "Unknown",
    wrapperTemplate: wrapper?.template ?? "",
    createdAt: experiment.createdAt,
    updatedAt: experiment.updatedAt,
    promptVersions: promptVersions.map((item) => ({
      id: item.id,
      versionNumber: item.versionNumber,
      promptText: item.promptText,
      changeNote: item.changeNote,
      createdAt: item.createdAt,
    })),
    results,
  };
}