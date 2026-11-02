#!/usr/bin/env node
/**
 * build-users-json.mjs
 *
 * Builds users.json, the default user list that index.html loads at startup.
 * The list comes from the 28 letter pages of https://imgsrc.ru/main/users.php
 * and is grouped by the first character so the UI can show one letter at a
 * time instead of rendering all ~65k <option> elements.
 *
 * Usage:
 *   node build-users-json.mjs
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USERS_URL = "https://imgsrc.ru/main/users.php";
const LETTERS = ["", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0"];
const CONCURRENCY = 4;
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/126.0.0.0 Safari/537.36";
const SYSTEM_NAMES = /^(main|members|blog|user|images|css)$/i;
const OUT_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "users.json"
);

function userGroupOf(name) {
  const first = name.charAt(0).toUpperCase();
  if (first >= "A" && first <= "Z") return first;
  if (first >= "0" && first <= "9") return "0–9";
  return "#";
}

function parseUsers(html) {
  const users = [];
  for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
    if (!/\btarget=['"]_blank['"]/i.test(tag)) continue;
    const href = tag.match(/\bhref=['"]\/([^/'"]+)['"]/i);
    if (!href) continue;
    let name = href[1];
    try {
      name = decodeURIComponent(name);
    } catch {
      // Keep the raw value when it is not valid percent-encoding.
    }
    if (!name || SYSTEM_NAMES.test(name)) continue;
    users.push(name);
  }
  return users;
}

async function fetchPage(letter) {
  const url = USERS_URL + (letter ? `?let=${encodeURIComponent(letter)}` : "");
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, "accept-language": "en" }
  });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const started = Date.now();
  const byName = new Map();
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < LETTERS.length) {
      const letter = LETTERS[cursor];
      cursor += 1;
      try {
        const html = await fetchPage(letter);
        for (const name of parseUsers(html)) {
          const key = name.toLowerCase();
          if (!byName.has(key)) byName.set(key, name);
        }
      } catch (error) {
        console.error(`Failed for "${letter || "A"}": ${error.message}`);
      }
      done += 1;
      console.log(
        `[${done}/${LETTERS.length}] ${letter || "A"} · ${byName.size} users`
      );
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, LETTERS.length) }, worker)
  );

  const groups = {};
  for (const name of byName.values()) {
    const group = userGroupOf(name);
    if (!groups[group]) groups[group] = [];
    groups[group].push(name);
  }
  for (const names of Object.values(groups)) {
    names.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  }

  const payload = {
    source: USERS_URL,
    generated: new Date().toISOString(),
    count: byName.size,
    groups
  };

  await writeFile(OUT_FILE, JSON.stringify(payload) + "\n");
  console.log(
    `Wrote ${byName.size} users to users.json in ${Date.now() - started} ms`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
