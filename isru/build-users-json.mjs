#!/usr/bin/env node
/**
 * build-users-json.mjs
 *
 * Builds users.json, the default user list that index.html loads at startup.
 * The list comes from the 27 letter pages of https://imgsrc.ru/main/users.php
 * and is grouped by the first character so the UI can show one letter at a
 * time instead of rendering all ~65k <option> elements.
 *
 * Usage:
 *   node build-users-json.mjs
 *
 * The proxy uses rebuildUsersGroup() to refresh a single letter group instead
 * of scraping every page again.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USERS_URL = "https://imgsrc.ru/main/users.php";
const LETTERS = ["", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0"];
const CONCURRENCY = 4;
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/126.0.0.0 Safari/537.36";
const SYSTEM_NAMES = /^(main|members|blog|user|images|css)$/i;
const USER_GROUPS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0"];
const OUT_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "users.json"
);

function userGroupOf(name) {
  const first = name.charAt(0).toUpperCase();
  if (first >= "A" && first <= "Z") return first;
  return "0";
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

export async function buildUsersJson() {
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

  const byGroup = new Map();
  for (const name of byName.values()) {
    const group = userGroupOf(name);
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push(name);
  }
  const groups = {};
  for (const group of USER_GROUPS) {
    const names = byGroup.get(group);
    if (!names || !names.length) continue;
    names.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    groups[group] = names;
  }

  const payload = {
    source: USERS_URL,
    generated: new Date().toISOString(),
    count: byName.size,
    groups
  };

  await writeFile(OUT_FILE, JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `Wrote ${byName.size} users to users.json in ${Date.now() - started} ms`
  );
  return payload;
}

function sortNames(names) {
  const byKey = new Map();
  for (const name of names) {
    const key = name.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, name);
  }
  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
}

export async function rebuildUsersGroup(group) {
  if (!USER_GROUPS.includes(group)) {
    const error = new Error(`Unknown user group "${group}".`);
    error.code = "INVALID_GROUP";
    throw error;
  }

  const started = Date.now();
  const html = await fetchPage(group);
  const names = sortNames(
    parseUsers(html).filter((name) => userGroupOf(name) === group)
  );

  let payload = {};
  try {
    payload = JSON.parse(await readFile(OUT_FILE, "utf8"));
  } catch {
    payload = {};
  }
  const previousGroups =
    payload.groups && typeof payload.groups === "object" ? payload.groups : {};

  const groups = {};
  for (const key of USER_GROUPS) {
    const list = Array.isArray(previousGroups[key]) ? previousGroups[key] : [];
    const kept = list.filter((name) => userGroupOf(name) !== group);
    if (kept.length) groups[key] = sortNames(kept);
  }
  if (names.length) groups[group] = names;

  const ordered = {};
  for (const key of USER_GROUPS) {
    if (groups[key]) ordered[key] = groups[key];
  }

  const next = {
    source: USERS_URL,
    generated: new Date().toISOString(),
    count: Object.values(ordered).reduce((sum, list) => sum + list.length, 0),
    groups: ordered
  };

  await writeFile(OUT_FILE, JSON.stringify(next, null, 2) + "\n");
  console.log(
    `Wrote ${names.length} users for "${group}" to users.json in ${
      Date.now() - started
    } ms`
  );
  return next;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  buildUsersJson().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
