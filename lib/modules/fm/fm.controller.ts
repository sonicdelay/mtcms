import { RouterContext } from "jsr:@oak/oak";
import { base, getFolderContent, getFragmentStat } from "../../fm.service.js";
import * as path from "jsr:@std/path";
import { isAbsolute } from "node:path";

const mediaPath = process.env.MEDIA_PATH || "./media/";

export const getContent = async (
  ctx: RouterContext<"/:path*"> | RouterContext<string>,
) => {
  const ctxPath = ctx.params.path || "";
  if (isAbsolute(ctxPath)) {
    ctx.response.status = 400;
    ctx.response.body = { errors: ["Bad Request: Absolute paths are not allowed"] };
    return;
  }
  const folderPath = path.resolve(mediaPath, ctxPath);
  try {
    const stat = await getFragmentStat(folderPath);
    // If it's a directory, return the folder content as JSON
    if (stat.isDirectory) {
      const content = await getFolderContent(folderPath || "");
      ctx.response.headers.set("Content-Type", "application/json");
      ctx.response.status = 200;
      ctx.response.body = JSON.stringify(content);
      return
    }
    // Handle .es6 files by importing and executing them
    if (folderPath.endsWith(".es6")) {
      try {
        const module = await import(`file://` + path.resolve(`${folderPath}`));
        if (typeof module.default === "function") {
          ctx.response.body = await module.default(ctx);
        } else {
          ctx.response.body = module;
        }
      } catch (err: unknown) {
        console.error("Execution error:", err);
        ctx.response.status = 500;
        ctx.response.body = {
          error: "Failed to execute code.",
          details: err instanceof Error ? err.message : String(err),
        };
      }
      return
    }
    // For other files, serve as download
    const content = await Deno.readFile(path.resolve(`${folderPath}`));
    ctx.response.headers.set("Content-Type", "application/octet-stream");
    ctx.response.headers.set(
      "Content-Disposition",
      `attachment; filename="${path.basename(folderPath)}"`,
    );
    ctx.response.headers.set("Content-Length", stat.size.toString());
    ctx.response.body = content;
    ctx.response.status = 200;
  } catch (err) {
    console.log("Error:", err);
    ctx.response.status = 404;
    ctx.response.body = { errors: ["Not Found"] };
  }
};

export const postContent = async (
  ctx: RouterContext<"/:path*"> | RouterContext<any>,
) => {
  // try {
  //   const stat = await Deno.stat(folderPath);
  //   if (stat.isDirectory) {
  //     console.log("DIRECTORY", folderPath);
  //     // const content = await getFolderContent(folderPath);
  //     // console.log("CONTENT", content);
  //     // ctx.response.headers.set("Content-Type", "application/json");
  //     // ctx.response.status = 200;
  //     // ctx.response.body = JSON.stringify(content);
  //   } else {
  //     console.log("FILE", folderPath);
  //     ctx.response.headers.set("Content-Type", "application/octet-stream");
  //     ctx.response.headers.set(
  //       "Content-Disposition",
  //       `attachment; filename="${path.basename(folderPath)}"`,
  //     );
  //     ctx.response.headers.set("Content-Length", stat.size.toString());
  //     ctx.response.body = await Deno.readFile(folderPath);
  //     ctx.response.status = 200;
  //   }
  // } catch (err) {
  //   console.log("Error:", err);
  //   ctx.response.status = 404;
  //   ctx.response.body = { errors: ["Not Found"] };
  // }
};

// export const putContent = (ctx: RouterContext<"/:path*">) => {
//   ctx.response.headers.set("Content-Type", "text/html");
//   ctx.response.status = 200;
// };

export const deleteContent = async (
  ctx: RouterContext<"/:path*"> | RouterContext<any>,
) => {
  // const folderPath = path.join(currentDir, ctx.params.path || "");
  // console.log("DELETE", folderPath);
  // try {
  //   const stat = await Deno.stat(folderPath);
  //   if (stat.isDirectory) {
  //     console.log("DIRECTORY", folderPath);
  //     // const content = await getFolderContent(folderPath);
  //     // console.log("CONTENT", content);
  //     // ctx.response.headers.set("Content-Type", "application/json");
  //     // ctx.response.status = 200;
  //     // ctx.response.body = JSON.stringify(content);
  //   } else {
  //     console.log("FILE", folderPath);
  //     // ctx.response.headers.set("Content-Type", "application/octet-stream");
  //     // ctx.response.headers.set(
  //     //   "Content-Disposition",
  //     //   `attachment; filename="${path.basename(folderPath)}"`,
  //     // );
  //     // ctx.response.headers.set("Content-Length", stat.size.toString());
  //     // ctx.response.body = await Deno.readFile(folderPath);
  //     // ctx.response.status = 200;
  //   }
  // } catch (err) {
  //   console.log("Error:", err);
  //   ctx.response.status = 404;
  //   ctx.response.body = { errors: ["Not Found"] };
  // }
};

export const putContent = async (
  ctx: RouterContext<"/:path*"> | RouterContext<any>,
) => {
  // const folderPath = path.join(currentDir, ctx.params.path || "");
  // console.log("PUT", folderPath);
  // try {
  //   const stat = await Deno.stat(folderPath);
  //   if (stat.isDirectory) {
  //     console.log("DIRECTORY", folderPath);
  //     // const content = await getFolderContent(folderPath);
  //     // console.log("CONTENT", content);
  //     // ctx.response.headers.set("Content-Type", "application/json");
  //     // ctx.response.status = 200;
  //     // ctx.response.body = JSON.stringify(content);
  //   } else {
  //     console.log("FILE", folderPath);
  //     // ctx.response.headers.set("Content-Type", "application/octet-stream");
  //     // ctx.response.headers.set(
  //     //   "Content-Disposition",
  //     //   `attachment; filename="${path.basename(folderPath)}"`,
  //     // );
  //     // ctx.response.headers.set("Content-Length", stat.size.toString());
  //     // ctx.response.body = await Deno.readFile(folderPath);
  //     // ctx.response.status = 200;
  //   }
  // } catch (err) {
  //   console.log("Error:", err);
  //   ctx.response.status = 404;
  //   ctx.response.body = { errors: ["Not Found"] };
  // }
};
// export const getContent = async (
//   ctx: RouterContext<"/:path*"> | RouterContext<any>,
//   next: Next,
// ) => {
//   console.log("FM...");
//   const fileItemPath = path.join(currentDir, ctx.params.path || ""); // Use path.join to ensure correct path resolution

//   fs.stat(fileItemPath, async (err, stat) => {
//     if (err) {
//       console.log("Error:", err);
//       ctx.response.status = 404;
//       ctx.response.body = { error: "File or directory not found" };
//       return;
//     }

//     if (stat.isDirectory()) {
//       // If it's a directory, return the folder content as a downloadable JSON file
//       const folderContent = await getFolderContent(fileItemPath);
//       const jsonContent = JSON.stringify(folderContent, null, 2);
//       const buffer = Buffer.from(jsonContent, "utf-8");

//       ctx.response.headers.set("Content-Type", "application/json");
//       ctx.response.headers.set(
//         "Content-Disposition",
//         `attachment; filename="folderContent.json"`,
//       );
//       ctx.response.headers.set("Content-Length", buffer.length.toString());
//       ctx.response.body = buffer;
//       ctx.response.status = 200;
//     } else {
//       // If it's a file, return the file directly for download
//       ctx.response.headers.set("Content-Type", "application/octet-stream");
//       ctx.response.headers.set(
//         "Content-Disposition",
//         `attachment; filename="${path.basename(fileItemPath)}"`,
//       );
//       ctx.response.headers.set("Content-Length", stat.size.toString());
//       ctx.response.body = fs.createReadStream(fileItemPath);
//       ctx.response.status = 200;
//     }
//   });

// const code = `
//     (async () => {
//       const res = await fetch("https://api.github.com");
//       const data = await res.json();
//       console.log("Fetched data from GitHub");
//     })();
//   `;
//           //const tempFile = await Deno.makeTempFile({ suffix: ".ts" });
//await Deno.writeTextFile(tempFile, new TextDecoder().decode(content));
//await import(`file://${tempFile}`);
// ctx.response.status = 200;
//ctx.response.body = { message: "Code executed successfully." };
//ctx.response.body = await module.default(ctx);
// ctx.response.headers.set("Content-Type", "text/javascript");
// // Dynamically import and execute the .es6 file
// const module = await import("file://" + folderPath);
// // If the module exports a function named 'default', execute it
// if (typeof module.default === "function") {
//   ctx.response.body = await module.default(ctx);
// } else {
//   ctx.response.body = module;
// }
// ctx.response.status = 200;
