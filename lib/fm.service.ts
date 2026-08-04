import * as path from "jsr:@std/path";
import { FileItem } from "../../models/file-item.intertface.ts";
import { stat } from "node:fs";

export const base = path.resolve(`./media/`) || `./media/`;

console.log("BASE", base);

export async function getFragmentStat(folderPath: string) {
  const stat = await Deno.stat(path.resolve(base, folderPath));
  return stat
}

export async function getFolderContent(folderPath: string): Promise<FileItem[]> {

  const absFolderPath = path.resolve(base, folderPath);
  const parentFolder = path.relative(base, path.resolve(base, folderPath, ".."));
  const items: FileItem[] = [
    {
      path: path.relative(base, absFolderPath),
      name: ".",
      type: "dir",
    }
  ];
  if (parentFolder !== "..") items.push(
    {
      path: parentFolder,
      name: "..",
      type: "dir",
    }
  );

  for await (const entry of Deno.readDir(absFolderPath)) {
    items.push({
      name: entry.name,
      path: path.relative(base, path.join(absFolderPath, entry.name)),
      type: entry.isDirectory ? "dir" : "file",
    });
  }

  return items;
}






// import { contentRange } from "jsr:@oak/commons@1/range";
// import { getHeapStatistics } from "node:v8";
// export async function getFolderContent1(folderPath: string = "media"): Promise<string[]> {
//   const files: string[] = [];
//   for await (const entry of Deno.readDir(folderPath)) {
//     if (entry.isFile) {
//       files.push(entry.name);
//     }
//   }
//   return files;
// }





// export const getFolderContent = async (folderName: string) => {
//   return new Promise<any>((resolvePromise, reject) => {
//     try {
//       // const base = path.resolve(currentBasePath[0]);
//       // console.log("BASE", base, folderName);

//       // const pathTrunk = path.relative(base, path.resolve(base, folderName));
//       // console.log("pathTrunk", pathTrunk);
//       const content: FileItem = [
//         {
//           path: path.relative(base,path.dirname(path.resolve(folderName))),
//           name: ".",
//           type: "dir",
//         },
//         {
//           path: path.relative(base,path.dirname(path.resolve(folderName))),
//           //.substring(cbpLength + 1)
//           // .normalize("/"),
//           name: "..",
//           type: "dir",
//         },
//       ];


//       for await (const entry of Deno.readDir(path.resolve(base, folderName))) {
//         // Use entry here, for example:
//         const type = entry.isDirectory ? "dir" : "file";
//         const data = {
//           name: entry.name,
//           path: path.relative(base, path.resolve(base, folderName, entry.name)),
//           type: type,
//         };
//         content.push(data);
//       }
//       //   contentRange.push({
//       //     ...entry,          
//       //   if (entry.isFile) {
//       //      console.log("FILE", file);
//       // //     content.push(entry.name);
//       // //   }
//       // // }


//       // //   fs.readdirSync(folderName).forEach((file) => {



//       // //     const stat = fs.statSync(path.resolve(folderName, file));
//       // //     const shortPath = path
//       // //       .resolve(folderName, file)

//       // // //     const type = stat.isDirectory() ? "dir" : "file";
//       //    const data = {
//       // // //       ...stat,
//       // // //       name: file,
//       // // //       path: shortPath, //.replace(/\\/g, "/"),
//       // // //       type: type,
//       //    };
//       //     content.push(data);
//       //  });
//       // console.log(JSON.stringify(content,null, " "));
//       resolvePromise(content);

//     } catch (err) {
//       reject(err);
//     }
//   });
// };

export const removeContent = (uri: string) => {
  return new Promise<void>((resolve, reject) => {
    stat(uri, (err, stat) => {
      if (err) {
        reject(new Error("File Not Found"));
      }
      if (stat !== undefined) {
        try {
          if (stat.isDirectory()) {
            console.log("DIR", uri);

            //            fs.rmSync(uri, { recursive: true, force: false });
          } else {
            console.log("FILE", uri);
            //fs.unlinkSync(uri);
          }
          resolve();
        } catch (err) {
          reject(new Error(`Error deleting content ${err}`));
        }
      }
    });
  });
};
//   private deleteContent = (
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction,
//   ) => {
//     let arg = '';
//     if (req.params[0] !== undefined) {
//       arg = req.params[0];
//     }
//     const uri = path.resolve(this.rootFolder, arg);
//     fs.stat(uri, (err, stat) => {
//       if (err) {
//         next(new HttpException(404, 'File Not Found'));
//       }
//       if (stat !== undefined) {
//         try {
//           if (stat.isDirectory()) {
//             fs.rmSync(uri, { recursive: true, force: false });
//           } else {
//             fs.unlinkSync(uri);
//           }
//           res.status(204).end();
//         } catch (err) {
//           next(
//             new HttpException(500, `Error deleting content ${err}`),
//           );
//         }
//       }
//     });
//   };
// }

// import * as express from 'express';
// import Controller from '../models/controller.interface';
// import * as fs from 'fs-extra';
// import * as path from 'path';
// import * as url from 'url';
// import HttpException from '../exceptions/HttpException';
// import multer from 'multer';
// import * as os from 'os';
// import * as util from 'util';
// import * as crypto from 'crypto';
// import * as querystring from 'querystring';
// import { v4 as uuidv4 } from 'uuid';
// import Files from '../repositories/files';

// interface content {
//   [key: string]: string[] | any;
// }

// export default class FileManagerController implements Controller {
//   public path = '/api/fm';
//   public router = express.Router();

//   private userFolders: string[] = [];
//   private rootFolder = '../';
//   private folderPath = this.rootFolder;
//   private currentBasePath = this.rootFolder;

//   constructor() {
//     this.initRoutes();
//     this.userFolders = [`${path.resolve(this.folderPath)}`];
//     this.currentBasePath = this.folderPath;
//   }

//   public initRoutes() {
//     //const upload = multer({ dest: 'scripts/' }); // ,upload.any()

//     this.router.get(`${this.path}/`, this.getContent);
//     this.router.get(`${this.path}/*`, this.getContent);
//     this.router.put(`${this.path}/*`, this.putContent);
//     this.router.post(`${this.path}/*`, this.postContent);
//     this.router.delete(`${this.path}/*`, this.deleteContent);
//   }

//   private getContent = (
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction,
//   ) => {
//     console.log("FM...");
//     let arg = '';
//     if (req.params[0] !== undefined) {
//       arg = req.params[0];
//     }
//     const uri = path.resolve(this.rootFolder, arg);
//     fs.stat(uri, (err, stat) => {
//       if (err) {
//         next(new HttpException(404, 'File Not Found'));
//       }
//       if (stat !== undefined) {
//         if (stat.isDirectory()) {
//           const content: content = this.getFolderContent(uri);
//           res.json(content);
//         } else {
//           const file = fs.createReadStream(uri);
//           res.setHeader('Content-Length', stat.size);
//           file.pipe(res);
//         }
//       } else {
//         next();
//       }
//     });
//   };

//   private getFolderContent = (folderName: string) => {
//     const cbpLength = path.resolve(this.currentBasePath).length;
//     const pathTrunk = path.resolve(folderName).substring(cbpLength + 1);
//     const content: content = [
//       {
//         path: pathTrunk,
//         name: '.',
//         type: 'dir',
//       },
//       {
//         path: path.resolve(folderName, '..').substring(cbpLength + 1),
//         name: '..',
//         type: 'dir',
//       },
//     ];
//     fs.readdirSync(folderName).forEach((file) => {
//       const stat = fs.statSync(path.resolve(folderName + '/' + file));
//       const shortPath = path
//         .resolve(folderName + '/' + file)
//         .substring(cbpLength + 1);
//       const type = stat.isDirectory() ? 'dir' : 'file';
//       const data = {
//         ...stat,
//         name: file,
//         path: shortPath,
//         type: type,
//       };
//       content.push(data);
//     });
//     return content;
//   };

//   private postContent = (
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction,
//   ) => {
//     console.log('POST-PARAM >>>>>:', req.params);
//     console.log(req.headers);
//     console.log('Body: ', req.body);
//     console.log('FILES: ', req.files);

//     let arg = '';
//     if (req.params[0] !== undefined) {
//       arg = req.params[0];
//     }
//     const uri = path.resolve(this.rootFolder, arg);
//     const base = path.basename(uri);
//     const folder = path.dirname(uri);

//     console.log('In & BAse:', uri, base, folder);

//     if (req.files?.length) {
//       console.log('Upload');
//     } else if (req.headers['content-length'] == '0') {
//       console.log('MKDIR');
//     } else if (req.headers['content-length'] !== '0') {
//       console.log('CREATE');
//     }

//     console.log(req.body);

//     if (!fs.existsSync(uri)) {
//       fs.stat(path.dirname(uri), (err, stat) => {
//         if (err) {
//           next(new HttpException(404, 'File Not Found'));
//         }
//         console.log(req.query);
//         if (req.query) {
//           fs.writeFileSync(uri, "req.body");
//         } else {
//           fs.mkdirSync(uri);
//         }
//       });
//     } else {
//       next(new HttpException(500, 'File already exists'));
//     }
//     //res.send("POST");
//     res.json({ ...req.body });
//   };

//   private putContent = (
//     req: express.Request,
//     res: express.Response
//   ) => {
//     console.log('PARAM', req.params);
//     console.log(req.headers);

//     res.send('POST');

//     let arg = '';
//     if (req.params[0] !== undefined) {
//       arg = req.params[0];
//     }
//     const uri = path.resolve(this.rootFolder, arg);
//     console.log('URL: ', uri);
//     console.log('DIR: ', path.dirname(uri));
//     console.log('BASE: ', path.basename(uri));
//     console.log('EXT: ', path.extname(uri));
//     console.log('HASH: ', new url.URL(uri).hash);
//     console.log('QUERY: ', req.query);
//     console.log('PARAMS: ', req.params);
//   };

//   private deleteContent = (
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction,
//   ) => {
//     let arg = '';
//     if (req.params[0] !== undefined) {
//       arg = req.params[0];
//     }
//     const uri = path.resolve(this.rootFolder, arg);
//     fs.stat(uri, (err, stat) => {
//       if (err) {
//         next(new HttpException(404, 'File Not Found'));
//       }
//       if (stat !== undefined) {
//         try {
//           if (stat.isDirectory()) {
//             fs.rmSync(uri, { recursive: true, force: false });
//           } else {
//             fs.unlinkSync(uri);
//           }
//           res.status(204).end();
//         } catch (err) {
//           next(
//             new HttpException(500, `Error deleting content ${err}`),
//           );
//         }
//       }
//     });
//   };
// }

// // private uploadContent = (
// //   req: express.Request,
// //   res: express.Response,
// //   next: express.NextFunction
// // ) => {
// //   let counter = 0;
// //   let fileItems: string[] = [];
// //   let hugeFileSize = [];
// //   let invalidFileTypes = [];

// //   let arg = '';
// //   if (req.params[0] !== undefined) {
// //     arg = req.params[0];
// //   }

// //   const uri = path.resolve(this.rootFolder, arg);
// //   this.folderPath = path.resolve(this.rootFolder, arg);

// //     let content: content = this.getFolderContent(this.folderPath);
// //     res.json(content);
// //   });
// //   req.pipe(busboy);
// // };

// // private getFolderHierarchy = (folderName: string) => {
// //   const content = {}; // klawSync(path.resolve(this.folderPath), {
// //   //     filter: (item: any) => {
// //   //         item.name = path.relative(this.folderPath, item.path);
// //   //         item.id = crypto
// //   //             .createHash('sha256')
// //   //             .update(item.path)
// //   //             .digest('hex');
// //   //         //console.log(item);
// //   //         return item;
// //   //     }
// //   // });

// //   return content;
// // };

// // private getHierarchy = (
// //   req: express.Request,
// //   res: express.Response,
// //   next: express.NextFunction
// // ) => {
// //   req.app.emit('action', 'Read hierarchy ...');
// //   console.log(this.folderPath);
// //   let content: content = this.getFolderHierarchy(this.folderPath);
// //   res.json(content);
// // };
