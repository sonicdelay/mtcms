/**
 * Minimal in-memory stand-in for basic-ftp's Client, implementing just the
 * surface walk()/moveFiles() rely on: cd(), list(), downloadTo(), remove(),
 * ensureDir(). downloadTo() writes real bytes to disk (of the remote size, or
 * of downloadSizeOverride's return value) so local size verification is
 * exercised for real. Test-only code — never imported from src/.
 */

import fs from "node:fs";
import path from "node:path";

function normalizePath(p) {
  const collapsed = "/" + p.split("/").filter(Boolean).join("/");
  return collapsed;
}

export class FakeFtpClient {
  /**
   * @param {Record<string, Array<{name: string, dir?: boolean, size?: number}>>} dirs
   *   Map of absolute directory path -> its listing.
   */
  constructor(dirs = {}) {
    this.dirs = dirs;
    this.cwd = "/";
    this.failDirs = new Set(); // paths whose list() throws
    this.links = {}; // symlinked path -> target path
    this.downloads = []; // { remotePath, localPath } in call order
    this.removed = []; // remote paths removed, in call order
    this.downloadError = null; // set to an Error to make downloads throw
    this.downloadSizeOverride = null; // function(remotePath, size) -> size to write
    this._remoteFiles = new Map(); // remote path -> size (from listings)
  }

  _resolve(p) {
    if (this.links[p]) return this.links[p];
    return normalizePath(p);
  }

  async cd(dir) {
    const target = this._resolve(
      dir.startsWith("/") ? dir : normalizePath(this.cwd + "/" + dir)
    );
    if (!(target in this.dirs)) {
      throw new Error(`550 ${target}: No such directory`);
    }
    this.cwd = target;
  }

  async list() {
    if (this.failDirs.has(this.cwd)) {
      throw new Error(`550 ${this.cwd}: Permission denied`);
    }
    const entries = this.dirs[this.cwd] ?? [];
    for (const e of entries) {
      if (!e.dir) {
        this._remoteFiles.set(
          normalizePath(this.cwd + "/" + e.name),
          e.size ?? 0
        );
      }
    }
    return entries.map((e) => ({
      name: e.name,
      size: e.size ?? 0,
      isDirectory: () => !!e.dir,
      isFile: () => !e.dir
    }));
  }

  async ensureDir(dir) {
    const target = this._resolve(
      dir.startsWith("/") ? dir : normalizePath(this.cwd + "/" + dir)
    );
    if (!(target in this.dirs)) this.dirs[target] = [];
  }

  async downloadTo(localPath, remotePath) {
    if (this.downloadError) throw this.downloadError;
    const abs = this._resolve(remotePath);
    if (!this._remoteFiles.has(abs)) {
      throw new Error(`550 ${abs}: No such file`);
    }
    const size = this._remoteFiles.get(abs);
    const bytesToWrite = this.downloadSizeOverride
      ? this.downloadSizeOverride(abs, size)
      : size;
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, Buffer.alloc(bytesToWrite, 0x61));
    this.downloads.push({ remotePath: abs, localPath });
    return { name: abs.split("/").pop(), size: bytesToWrite };
  }

  async remove(remotePath) {
    const abs = this._resolve(remotePath);
    this.removed.push(abs);
  }
}
