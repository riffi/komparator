const HTML_OUTPUT_REQUIREMENT = [
  "Return only one complete self-contained HTML document for a single-page result.",
  "Inline all CSS and JavaScript inside that HTML document.",
  "Do not use external assets, libraries, CDNs, markdown fences, or extra explanation outside the HTML.",
].join("\n");

export function getPromptSystemAddition() {
  return HTML_OUTPUT_REQUIREMENT;
}

export function buildPromptForClipboard(promptText: string, wrapperTemplate?: string | null) {
  const normalizedPrompt = promptText.trim();
  if (!normalizedPrompt) {
    return "";
  }

  const promptWithSystemAddition = `${HTML_OUTPUT_REQUIREMENT}\n\nTask:\n${normalizedPrompt}`;

  if (wrapperTemplate?.includes("{{prompt}}")) {
    return wrapperTemplate.replace("{{prompt}}", promptWithSystemAddition);
  }

  return promptWithSystemAddition;
}
