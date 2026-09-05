import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractAxisSource, extractCommitmentSource } from "./programme-source";
import type { CategorySlug, CommitmentSlug } from "./i18n/types";

function readProgramme() {
  return readFile(path.join(process.cwd(), "chat.md"), "utf8");
}

export async function getAxisSource(slug: CategorySlug) {
  const markdown = await readProgramme();
  return extractAxisSource(markdown, slug);
}

export async function getCommitmentSource(slug: CommitmentSlug) {
  const markdown = await readProgramme();
  return extractCommitmentSource(markdown, slug);
}
