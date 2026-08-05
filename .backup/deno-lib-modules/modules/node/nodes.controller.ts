import { RouterContext } from "jsr:@oak/oak";
import {
  addNode,
  getAllNodes,
  getBreadcrumb,
  getChildren,
  getNodeById,
  getParent,
  removeNode,
  writeNode,
} from "../../nodes.service.js";
import { Node } from "../../models/node.interface.ts";

export const readAllNodes = async (ctx: RouterContext<"/">) => {
  const type: string = ctx.request.url.searchParams.get("type") || "";
  const nodes = await getAllNodes(type);
  ctx.response.body = nodes;
};

export const readNodeById = async (ctx: RouterContext<"/:id">) => {
  const id = ctx.params.id;
  const scope: string = ctx.request.url.searchParams.get("scope") || "";
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Missing node ID" };
    return;
  }
  try {
    switch (scope) {
      case "parent":
        ctx.response.body = await getParent(id);
        break;
      case "children":
        ctx.response.body = await getChildren(id);
        break;
      case "breadcrumb":
        ctx.response.body = await getBreadcrumb(id);
        break;
      case "editor": {
        const node = await getNodeById(id);
        node.children = await getChildren(id);
        node.breadcrumb = await getBreadcrumb(id);
        ctx.response.body = node;
        break;
      }
      default:
        ctx.response.body = await getNodeById(id);
        break;
    }
  } catch (err) {
    ctx.response.status = 404;
    if (err instanceof Error) {
      ctx.response.body = { message: err.message };
    } else {
      ctx.response.body = { message: "An unknown error occurred" };
    }
  }
};

export const createNode = async (ctx: RouterContext<"/">) => {
  try {
    const body: Node = await ctx.request.body.json();
    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { message: "400 - Missing node data" };
      return;
    }
    const node = await addNode(body);
    console.log(node);
    if (!node) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Invalid node data" };
      return;
    }
    console.log("Result of creation", node as Node);
    ctx.response.status = 201;


    ctx.response.headers.set("location", `/api/node/${node.id}`);
    ctx.response.body = { message: "Node created", data: node };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { message: (err as any).message };
  }
};

export const updateNode = async (ctx: RouterContext<"/:id">) => {
  const id = ctx.params.id;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Missing node ID" };
    return;
  }
  const body = await ctx.request.body.json();
  const node = await writeNode(id, body);
  ctx.response.body = { node };
};

export const deleteNode = async (ctx: RouterContext<"/:id">) => {
  const id = ctx.params.id;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Missing node ID" };

  }

  try {
    await removeNode(id);
    ctx.response.status = 204;
  } catch (err: any) {
    ctx.response.status = 404;
    ctx.response.body = { message: err.message };
  }
};

// // // Check if the table is empty
// // const { count } = await sql`SELECT COUNT(*)::INT as count FROM books`.then((rows) => rows[0]);

// // if (count === 0) {
// //     // The table is empty, insert the book records
// //     await sql`
// //     INSERT INTO books (title, author) VALUES
// //       ('The Hobbit', 'J. R. R. Tolkien'),
// //       ('Harry Potter and the Philosopher''s Stone', 'J. K. Rowling'),
// //       ('The Little Prince', 'Antoine de Saint-Exupéry')
// //   `;
// // }

// export const nodeRouter = new Router()
//   .get('/', async (ctx) => {
//     try {
//       const type: string | null = ctx.request.url.searchParams.get(
//         'type',
//       );
//       if (type != null) {
//         await Nodes.getByType(type)
//           .then((data) => ctx.response.body = data as any)
//           .catch((err) => {
//             console.error(err);
//             ctx.response.status = 404;
//           });
//       } else {
//         ctx.response.body = await Nodes.getNodes() as any;
//       }
//     } catch (err: unknown) {
//       console.error(err);
//     }
//   })
//   .get('/:nodeId', async (ctx) => {
//     try {
//       const scope: string | null = ctx.request.url.searchParams.get('scope') ||
//         null;
//       const id = ctx.params.nodeId;
//       let node: Node = await Nodes.getNodeById(id) as Node;
//       if (scope != null) {
//         console.log('Scope1', scope);
//         switch (scope) {
//           case 'parent':
//             node = await Nodes.getParent(id) as Node;
//             break;
//           case 'children':
//             node.children = await Nodes.getChildren(id);
//             break;
//           case 'breadcrumb':
//             node.breadcrumb = await Nodes.getBreadcrumb(id);
//             break;
//           case 'editor':
//             node.children = await Nodes.getChildren(id);
//             node.breadcrumb = await Nodes.getBreadcrumb(id);
//             break;
//           case 'default':
//             console.log('Default');
//             break;
//         }

//         //node.breadcrumb = [];

//         // const nodes = await sql`SELECT * FROM nodes WHERE id=${id}`;
//         // // await Nodes.getByType(type)
//         //     .then(data => ctx.response.body = data as any)
//         //     .catch(err => {
//         //         console.error(err);
//         //         ctx.response.status = 404;
//         //     });
//         console.log(node);
//       }
//       ctx.response.body = node;
//     } catch (err: unknown) {
//       console.error(err);
//       ctx.response.status = 404;
//       ctx.response.body = 'Not found';
//     }
//   })
//   .post('/:nodeId', (ctx) => {
//     ctx.response.body = 'Create Node';
//   })
//   .put('/', (ctx) => {
//     ctx.response.body = 'Update Node';
//   })
//   .delete('/:nodeId', (ctx) => {
//     ctx.response.body = 'Delete A Node';
//   });
// // .use("/:nodeId/reviews", reviewsRouter.routes())

// // .use("/:nodeId/images", imagesRouter.routes());
