import { parseDocument } from "yaml";

/** Parse without rewriting source; malformed frontmatter is never sanitized. */
export function parsePost(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(source);
  if (!match) throw new Error("Expected YAML frontmatter between opening and closing --- lines.");
  const document = parseDocument(match[1]);
  if (document.errors.length) throw document.errors[0];
  if (!document.toJS() || Array.isArray(document.toJS()) || typeof document.toJS() !== "object") throw new Error("Frontmatter must be a field mapping.");
  return { document, body: source.slice(match[0].length), newline: match[2], bodyLine: match[0].split("\n").length };
}
