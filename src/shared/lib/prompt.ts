const HTML_OUTPUT_REQUIREMENT = [
  "Return only one complete HTML document for a single-page result.",
  "You may use external assets, libraries, fonts, and CDNs when they help.",
  "Do not wrap the response in markdown fences and do not add explanation outside the HTML.",
  "Do not rely on localStorage, sessionStorage, IndexedDB, cookies, or other browser persistence APIs.",
  "The result must work as a self-contained preview without requiring previously saved client-side state.",
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
