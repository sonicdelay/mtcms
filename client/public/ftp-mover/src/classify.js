/**
 * Decide whether a remote file name is a media file we move.
 *
 * Matching is case-insensitive and works on the final extension only, so
 * "backup.jpg.bak" does NOT match.
 *
 * @param {string} fileName Remote file name, e.g. "IMG_0001.JPG"
 * @param {{ imageExtensions: string[], videoExtensions: string[] }} config
 * @returns {boolean}
 */
export function isMediaFile(fileName, config) {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return false; // no ext / dotfile
  const ext = fileName.slice(dot + 1).toLowerCase();
  const known = [
    ...(config.imageExtensions ?? []),
    ...(config.videoExtensions ?? [])
  ].map((e) => e.toLowerCase());
  return known.includes(ext);
}
