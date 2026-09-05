/**
 * Lint: the deterministic core contains no floating-point arithmetic (ADR 0002).
 *
 * Walks the TypeScript AST of every file under the linted directories
 * (default `src/core`) and reports:
 * - numeric literals with a fractional part or exponent;
 * - the `/`, `/=`, `**` and `**=` operators, on any operands;
 * - any use of `Math`, `parseFloat`, `Number(...)`, unary `+`, and the
 *   `toFixed`, `toPrecision` and `toExponential` methods.
 *
 * Usage: node scripts/lint-no-floats.ts [directory ...]
 * Exits 1 with one line per finding when anything is found.
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

const repositoryRoot = resolve(import.meta.dirname, "..");
const directories = process.argv.length > 2 ? process.argv.slice(2) : ["src/core"];

const FORBIDDEN_METHODS = new Set(["toFixed", "toPrecision", "toExponential"]);
const DIVISION_OPERATORS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.SlashToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
]);

function listTypeScriptFiles(directory: string): string[] {
  const absolute = resolve(repositoryRoot, directory);
  if (!statSync(absolute).isDirectory()) return [absolute];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const path = join(absolute, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

function compilerOptions(): ts.CompilerOptions {
  const configPath = ts.findConfigFile(repositoryRoot, ts.sys.fileExists, "tsconfig.json");
  if (configPath === undefined) return {};
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config.config, ts.sys, repositoryRoot).options;
}

interface Finding {
  file: string;
  line: number;
  column: number;
  message: string;
}

function lint(files: string[]): Finding[] {
  const program = ts.createProgram(files, compilerOptions());
  const findings: Finding[] = [];
  const wanted = new Set(files);

  for (const sourceFile of program.getSourceFiles()) {
    if (!wanted.has(sourceFile.fileName)) continue;
    const report = (node: ts.Node, message: string) => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      findings.push({
        file: relative(repositoryRoot, sourceFile.fileName),
        line: line + 1,
        column: character + 1,
        message,
      });
    };
    const visit = (node: ts.Node): void => {
      if (ts.isNumericLiteral(node)) {
        const text = node.getText(sourceFile);
        const prefixed = /^0[xXoObB]/.test(text);
        if (!prefixed && /[.eE]/.test(text)) {
          report(node, `floating-point literal ${text}`);
        }
      } else if (ts.isBinaryExpression(node) && DIVISION_OPERATORS.has(node.operatorToken.kind)) {
        report(node.operatorToken, `operator ${node.operatorToken.getText(sourceFile)}`);
      } else if (ts.isPropertyAccessExpression(node)) {
        if (ts.isIdentifier(node.expression) && node.expression.text === "Math") {
          report(node, `Math.${node.name.text}`);
        } else if (FORBIDDEN_METHODS.has(node.name.text)) {
          report(node, `.${node.name.text}()`);
        } else if (node.name.text === "parseFloat") {
          report(node, "parseFloat");
        }
      } else if (ts.isIdentifier(node) && node.text === "parseFloat") {
        report(node, "parseFloat");
      } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Number") {
        report(node, "Number(...) conversion; use parseInt(digits, 10)");
      } else if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.PlusToken) {
        report(node, "unary + conversion");
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return findings;
}

const findings = lint(directories.flatMap(listTypeScriptFiles));
for (const finding of findings) {
  process.stdout.write(
    `${finding.file}:${finding.line}:${finding.column} ${finding.message} is not allowed in the core (ADR 0002)\n`,
  );
}
if (findings.length > 0) {
  process.stdout.write(`${findings.length} floating-point finding(s)\n`);
  process.exit(1);
}
process.stdout.write(`no floating-point arithmetic in ${directories.join(", ")}\n`);
