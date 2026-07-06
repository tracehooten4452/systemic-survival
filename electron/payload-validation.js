const REQUIRED_MARKERS = [
  { label: "#ss-canvas missing", test: (text) => text.includes("ss-canvas") },
  { label: "SYSTEMIC wordmark missing", test: (text) => text.includes("SYSTEMIC") },
  { label: "<x-dc> payload marker missing", test: (text) => text.includes("<x-dc>") }
];

const FORBIDDEN_PATTERNS = [
  { label: "external font URLs present", regex: /fonts\.googleapis|fonts\.gstatic/i },
  { label: "external <script src> present", regex: /<script\b[^>]*\bsrc\s*=\s*["']?\s*https?:\/\//i },
  { label: "external <link href> present", regex: /<link\b[^>]*\bhref\s*=\s*["']?\s*https?:\/\//i },
  { label: "external @import present", regex: /@import\s+(?:url\(\s*)?["']?\s*https?:\/\//i },
  { label: "file:// reference present", regex: /\bfile:\/\//i }
];

function payloadProblems(text) {
  const problems = [];

  for (const marker of REQUIRED_MARKERS) {
    if (!marker.test(text)) problems.push(marker.label);
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.regex.test(text)) problems.push(pattern.label);
  }

  return problems;
}

function validPayloadText(text) {
  return payloadProblems(text).length === 0;
}

module.exports = { payloadProblems, validPayloadText };
