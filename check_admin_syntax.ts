import * as ts from "typescript";
import * as fs from "fs";

const fileContent = fs.readFileSync("AdminPromptSandbox.tsx", "utf8");
const sourceFile = ts.createSourceFile("AdminPromptSandbox.tsx", fileContent, ts.ScriptTarget.Latest, true);

function findErrors(node: ts.Node) {
    // Just relying on tsc
}
