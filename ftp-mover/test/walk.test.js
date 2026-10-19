import test from "node:test";
import assert from "node:assert/strict";
import { walk } from "../src/walk.js";
import { FakeFtpClient } from "./helpers/fake-ftp-client.js";

const config = {
  imageExtensions: ["jpg", "png"],
  videoExtensions: ["mp4"]
};

function entry(name, { dir = false, size = 0 } = {}) {
  return { name, dir, size };
}

test("collects media files recursively with absolute paths and sizes", async () => {
  const client = new FakeFtpClient({
    "/": [entry("DCIM", { dir: true }), entry("notes.txt", { size: 10 })],
    "/DCIM": [
      entry("Camera", { dir: true }),
      entry("banner.png", { size: 99 })
    ],
    "/DCIM/Camera": [entry("IMG_0001.jpg", { size: 1234 })]
  });

  const found = await walk(client, ["/"], config);

  assert.deepEqual(found, [
    { path: "/DCIM/banner.png", name: "banner.png", size: 99 },
    { path: "/DCIM/Camera/IMG_0001.jpg", name: "IMG_0001.jpg", size: 1234 }
  ]);
});

test("walks multiple whitelisted paths and normalizes them", async () => {
  const client = new FakeFtpClient({
    "/Movies": [entry("clip.mp4", { size: 5 })],
    "/Pictures": [entry("a.jpg", { size: 6 })]
  });

  const found = await walk(client, ["/Movies/", "Pictures"], config);

  assert.deepEqual(
    found.map((f) => f.path),
    ["/Movies/clip.mp4", "/Pictures/a.jpg"]
  );
});

test("warns and continues when a directory cannot be listed", async () => {
  const client = new FakeFtpClient({
    "/": [entry("Android", { dir: true }), entry("DCIM", { dir: true })],
    "/DCIM": [entry("photo.jpg", { size: 7 })]
  });
  client.failDirs.add("/Android");

  const warnings = [];
  const found = await walk(client, ["/"], config, (msg) => warnings.push(msg));

  assert.deepEqual(
    found.map((f) => f.path),
    ["/DCIM/photo.jpg"]
  );
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Android/);
});

test("does not loop forever on directories that point back at an ancestor", async () => {
  const client = new FakeFtpClient({
    "/": [entry("a", { dir: true })],
    "/a": [entry("b", { dir: true })],
    "/a/b": [entry("loop", { dir: true }), entry("pic.jpg", { size: 3 })]
  });
  // /a/b/loop is a symlink back to /a — cd("/a/b/loop") resolves to /a
  client.links["/a/b/loop"] = "/a";

  const found = await walk(client, ["/"], config);

  assert.deepEqual(
    found.map((f) => f.path),
    ["/a/b/pic.jpg"]
  );
});

test("warns when the whitelisted root itself is missing", async () => {
  const client = new FakeFtpClient({});

  const warnings = [];
  const found = await walk(client, ["/nope"], config, (msg) =>
    warnings.push(msg)
  );

  assert.deepEqual(found, []);
  assert.equal(warnings.length, 1);
});
