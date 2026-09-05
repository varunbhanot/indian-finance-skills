/**
 * Fail fast, and in English, when the Node running this repository is too old
 * (issue #37).
 *
 * There is no build step here: `npm test`, `npm run lint` and `npm run
 * typecheck` all hand Node a `.ts` file directly and rely on it stripping the
 * types itself, which Node does without a flag from 22.18 onward. Below that
 * every one of them dies with
 *
 *     TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
 *
 * which names neither Node nor a version and reads like a bug in the product.
 * `engines` in `package.json` does not help: npm only enforces it under
 * `engine-strict`, and it is not set here because a warning at install time is
 * not what a contributor is looking at when the suite explodes.
 *
 * So this runs first, as the `pre` script of each of the three, and says the
 * version it found, the version it needs, and why.
 *
 * Deliberately plain JavaScript. A `.ts` guard could not run on the Node it
 * exists to catch, and would fail with the very error it is here to explain.
 * It reads the requirement from `package.json` rather than repeating it, so
 * there is one place to raise it.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).engines.node;

const wanted = parse(required.replace(/^[^\d]*/, ""));
const running = parse(process.versions.node);

if (older(running, wanted)) {
  process.stderr.write(
    [
      "",
      `This repository needs Node ${required}. You are running ${process.versions.node}.`,
      "",
      "There is no build step: the scripts run the TypeScript sources directly, which",
      "Node can do without a flag from 22.18 onward. On an older Node every script here",
      'fails with ERR_UNKNOWN_FILE_EXTENSION on a ".ts" file, which looks like a bug in',
      "this repository and is not one.",
      "",
      "Install Node 22.18 or later (`nvm install 22`, or https://nodejs.org), then",
      "re-run. CI runs Node 22.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

/** `major.minor` is all that is compared; the patch has never been the boundary. */
function parse(version) {
  const [major, minor] = version.split(".");
  return { major: Number.parseInt(major, 10), minor: Number.parseInt(minor ?? "0", 10) };
}

function older(found, needed) {
  return found.major !== needed.major ? found.major < needed.major : found.minor < needed.minor;
}
