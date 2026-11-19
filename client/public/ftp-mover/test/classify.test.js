import test from "node:test";
import assert from "node:assert/strict";
import { isMediaFile } from "../src/classify.js";

const config = {
  imageExtensions: ["jpg", "jpeg", "png"],
  videoExtensions: ["mp4", "mkv"]
};

test("matches image extensions case-insensitively", () => {
  assert.equal(isMediaFile("IMG_0001.JPG", config), true);
  assert.equal(isMediaFile("photo.jpeg", config), true);
  assert.equal(isMediaFile("shot.PnG", config), true);
});

test("matches video extensions case-insensitively", () => {
  assert.equal(isMediaFile("clip.mp4", config), true);
  assert.equal(isMediaFile("movie.MKV", config), true);
});

test("rejects non-media files", () => {
  assert.equal(isMediaFile("notes.txt", config), false);
  assert.equal(isMediaFile("archive.zip", config), false);
  assert.equal(isMediaFile("noextension", config), false);
});

test("rejects lookalike extensions that only share a suffix", () => {
  assert.equal(isMediaFile("backup.jpg.bak", config), false);
  assert.equal(isMediaFile("mp4", config), false);
});
