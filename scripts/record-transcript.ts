/**
 * The recorder (issue #15): holds a real conversation between a model and the
 * `ctc-decoder` skill, against a letter a contributor supplies, and writes it
 * out as `transcript.json` in the shape `fixtures/transcripts/README.md`
 * documents. It needs a model and is run by a contributor, not CI — the
 * opposite half of `test/traceability.test.ts`, which replays what this
 * writes with no model and no network.
 *
 * The skill's own step 4 and step 5 say to run
 * `npm run ctc-decoder -- '<json>'` from a shell. This script gives the model
 * a single tool, `run_ctc_decoder`, that does exactly that — the real CLI,
 * the repository's own shipped `rules/` and `heuristics.yaml`, nothing
 * stubbed — so every tool event this writes is byte-identical to what a live
 * Claude Code session would have produced.
 *
 * Usage:
 *
 *   ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=... \
 *     npm run record-transcript -- <letter-file> fixtures/transcripts/<name>/transcript.json
 *
 * `<letter-file>` is a plain-text file holding the first message a user would
 * send — the pasted annexure and the question, exactly as
 * `fixtures/transcripts/happy-path/transcript.json`'s first `user` event
 * reads. The session is then interactive: the model's replies print as they
 * arrive, and each prompt reads the next line to send back as the user —
 * blank input, or end-of-input (Ctrl-D), ends the session and writes the
 * transcript.
 *
 * `ANTHROPIC_MODEL` is not defaulted here: pick the current model yourself
 * rather than have this script's answer to that question go stale.
 *
 * What this script does not do: assign a `step` to each event. That field is
 * optional (`fixtures/transcripts/README.md`) and exists for a human reading
 * the transcript later — add it by hand, matching the `SKILL.md` section
 * number, if you want the transcript to carry it. Then run
 * `npm run check-transcript -- <path>` before committing: it is the same
 * eval `npm test` runs, so a transcript that would fail in CI fails there
 * first, with the same value named.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import type { Transcript, TranscriptEvent } from "../test/lib/traceability.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TOKENS = 8192;
const SKILL_PATH = ".claude/skills/ctc-decoder/SKILL.md";

const repositoryRoot = resolve(import.meta.dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

async function main(): Promise<void> {
  const [letterPath, outputPath] = process.argv.slice(2);
  if (letterPath === undefined || outputPath === undefined || process.argv.length > 4) {
    process.stderr.write(
      "usage: npm run record-transcript -- <letter-file> fixtures/transcripts/<name>/transcript.json\n",
    );
    process.exit(1);
  }

  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const model = requireEnv("ANTHROPIC_MODEL");
  const system = systemPromptFrom(readFileSync(resolve(repositoryRoot, SKILL_PATH), "utf8"));
  const letterText = readFileSync(letterPath, "utf8").trim();

  const events: TranscriptEvent[] = [{ kind: "user", text: letterText }];
  const messages: AnthropicMessage[] = [{ role: "user", content: letterText }];

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write(`${letterText}\n\n`);

  try {
    for (;;) {
      const response = await callClaude({ apiKey, model, system, messages });
      messages.push({ role: "assistant", content: response.content });

      const toolUses = response.content.filter(
        (block): block is AnthropicToolUseBlock => block.type === "tool_use",
      );
      const text = response.content
        .filter((block): block is AnthropicTextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      if (text !== "") {
        process.stdout.write(`${text}\n\n`);
        events.push({ kind: "assistant", text });
      }

      if (toolUses.length > 0) {
        const results: AnthropicToolResultBlock[] = [];
        for (const toolUse of toolUses) {
          const { input, output } = runDecoder(toolUse.input.json);
          events.push({ kind: "tool", input, output });
          results.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(output, null, 2),
            is_error: typeof output === "object" && output !== null && "error" in output,
          });
        }
        messages.push({ role: "user", content: results });
        continue;
      }

      const reply = (await rl.question("> ")).trim();
      if (reply === "" || reply === "/end") break;
      events.push({ kind: "user", text: reply });
      messages.push({ role: "user", content: reply });
    }
  } finally {
    rl.close();
  }

  const transcript: Transcript = {
    letter: basename(letterPath, extname(letterPath)),
    skill: SKILL_PATH,
    recorded: new Date().toISOString().slice(0, 10),
    events,
  };
  writeFileSync(outputPath, `${JSON.stringify(transcript, null, 2)}\n`);
  process.stdout.write(`\nWrote ${outputPath}. Run: npm run check-transcript -- ${outputPath}\n`);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    process.stderr.write(`${name} must be set — this script needs a model, and holds its own key.\n`);
    process.exit(1);
  }
  return value;
}

/** The skill's own text, past its frontmatter, plus what the tool substitutes for. */
function systemPromptFrom(skillMarkdown: string): string {
  const withoutFrontmatter = skillMarkdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  return `${withoutFrontmatter}

You are recording a transcript for this repository's traceability eval. Steps
4 and 5 above say to run \`npm run ctc-decoder -- '<json>'\` from a shell —
here, call the \`run_ctc_decoder\` tool with that same JSON document instead;
it runs the real CLI and returns exactly what it would have printed. Do not
simulate the tool's output yourself.`;
}

/** Runs the real CLI on `json` and returns the input it decoded plus what came back. */
function runDecoder(json: string): { input: unknown; output: unknown } {
  const result = spawnSync(npm, ["run", "--silent", "ctc-decoder", "--", json], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, CTC_DECODER_RULES_DIR: "rules", CTC_DECODER_HEURISTICS_FILE: "heuristics.yaml" },
  });
  if (result.error !== undefined) throw result.error;
  const output: unknown = JSON.parse(result.status === 0 ? result.stdout : result.stderr);
  return { input: JSON.parse(json), output };
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: { json: string };
}

interface AnthropicToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error: boolean;
}

type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[] | AnthropicToolResultBlock[];
}

async function callClaude(request: {
  apiKey: string;
  model: string;
  system: string;
  messages: AnthropicMessage[];
}): Promise<{ content: AnthropicContentBlock[] }> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": request.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: MAX_TOKENS,
      system: request.system,
      messages: request.messages,
      tools: [
        {
          name: "run_ctc_decoder",
          description:
            "Runs `npm run ctc-decoder -- '<json>'` from the repository root and returns exactly what it printed: the decoded offer on success, or { error: { code, message, path } } on rejection.",
          input_schema: {
            type: "object",
            properties: {
              json: { type: "string", description: "The exact JSON document the CLI's one argument would be." },
            },
            required: ["json"],
          },
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API returned ${response.status}: ${await response.text()}`);
  }
  const body = (await response.json()) as { content: AnthropicContentBlock[] };
  return body;
}

await main();
