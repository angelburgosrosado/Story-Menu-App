import fs from "fs";

const file = "Setup.tsx";
let code = fs.readFileSync(file, "utf8");

// Strip curly brace content to isolate pure JSX tags
function stripBraces(str: string): string {
  let result = "";
  let depth = 0;
  let inString: '"' | "'" | "`" | null = null;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }

    if (inString) {
      if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    if (char === "{") {
      depth++;
      continue;
    }
    if (char === "}") {
      if (depth > 0) depth--;
      continue;
    }

    if (depth === 0) {
      result += char;
    }
  }
  return result;
}

const cleanCode = stripBraces(code);

// Parse tags
const lines = cleanCode.split("\n");
const stack: { tag: string; line: number; text: string }[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const tagRegex = /<\/?([a-zA-Z0-9:-]+)(?:\s+[^>]*)?>|(<>\s*)|(<\/\s*>)/g;
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const fullTag = match[0];
    const isClose = fullTag.startsWith("</") || fullTag === "</>";
    let tagName = match[1] || "";
    if (fullTag === "<>") tagName = "Fragment";
    if (fullTag === "</>") tagName = "Fragment";

    if (fullTag.endsWith("/>") && !isClose) {
      continue;
    }
    if (["input", "img", "br", "hr", "meta", "link"].includes(tagName) && !isClose) {
      continue;
    }

    if (!isClose) {
      stack.push({ tag: tagName, line: i + 1, text: fullTag });
    } else {
      if (stack.length === 0) {
        console.log(`Extra closing tag ${fullTag} on line ${i + 1}`);
      } else {
        const last = stack.pop();
        if (last && last.tag !== tagName) {
          console.log(`Mismatch at line ${i + 1}: Open '${last.tag}' (line ${last.line}) vs Close '${tagName}' (${fullTag})`);
          // Stop after first mismatch to find the source
          process.exit(0);
        }
      }
    }
  }
}

console.log("No mismatches found!");
