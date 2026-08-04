import { Router } from "jsr:@oak/oak";
import * as uuid from "jsr:@std/uuid";
//import { showLandingPage } from "./page.controller.ts";

const router = new Router();

// Store connected clients by their clientId
const connectedClients = new Map<string, WebSocket>();

router
  .prefix("/")
  .get("/ws", async (ctx) => {
    if (!ctx.isUpgradable) {
      ctx.throw(501);
    }


    //router.get("/ws", (context) => {
    const { socket, response } = Deno.upgradeWebSocket(ctx.request.source!);
    ctx.response.with(response);


        const NAMESPACE_URL = crypto.randomUUID();
        const data = new TextEncoder().encode("deno.land");
        const clientId = ctx.request.headers.get("sec-websocket-key") || await uuid.v5.generate(NAMESPACE_URL, data);
        connectedClients.set(clientId, socket);

         console.log(`New WebSocket connection established with ID: ${clientId}`);




    socket.onmessage = (event) => {
      console.log(event.data, connectedClients);
      socket.send(event.data);
    };

    //});


    // const ws = ctx.upgrade({});

    socket.onopen = () => {
      console.log("Connected to client");
      socket.send("Hello from server!");
    };

    // ws.onmessage = (m) => {
    //   console.log("Message from client:", m.data);
    //   ws.send(m.data);
    // };
  });

export default router;








// const ws = new WebSocket("ws://localhost:8421/ws");

// // Setting up event handlers
// ws.onopen = (event) => {
//   console.log("Connected to the server");
//   ws.send("Hello Server!");
// };

// ws.onmessage = (event) => {
//   console.log(`Received: ${event.data}`);
// };

// ws.onerror = (event) => {
//   console.error("WebSocket error observed:", event);
// };

// ws.onclose = (event) => {
//   console.log(`WebSocket closed: Code=${event.code}, Reason=${event.reason}`);
// };

// .get("/ws", (ctx) => {
//   if (!ctx.isUpgradable) {
//     ctx.throw(501);
//   }

//   const ws = ctx.upgrade();

//   ws.onopen = () => {
//     console.log("Connected to client");
//     ws.send("Hello from server!");
//   };

//   ws.onmessage = (m) => {
//     console.log("Message from client:", m.data);
//     ws.send(m.data);
//   };
// });


// app.use(async (ctx, next) => {
//   if (ctx.request.url.pathname === '/ws') {
//     const sock = ctx.upgrade() as WebSocket;
//     const NAMESPACE_URL = crypto.randomUUID();
//     const data = new TextEncoder().encode("deno.land");
//     const clientId = ctx.request.headers.get("sec-websocket-key") || await uuid.v5.generate(NAMESPACE_URL, data);
//     connectedClients.set(clientId, sock);

//     console.log(`New WebSocket connection established with ID: ${clientId}`);

//     sock.onopen = () => console.log(`WebSocket connection opened with ID: ${clientId}`);
//     sock.onmessage = (e) => {
//       console.log(`Message from client [ID: ${clientId}]:`, e.data);
//       // Broadcast the message to all connected clients
//       for (const [id, clientSock] of connectedClients.entries()) {
//         if (clientSock.readyState === WebSocket.OPEN) {
//           clientSock.send(`Broadcast from [ID: ${clientId}]: ${e.data}`);
//         }
//       }
//     };
//     sock.onclose = () => {
//       console.log(`WebSocket connection closed with ID: ${clientId}`);
//       connectedClients.delete(clientId);
//     };
//     sock.onerror = (e) => {
//       if (e instanceof ErrorEvent) {
//         console.error(`WebSocket error [ID: ${clientId}]:`, e.message);
//       } else {
//         console.error(`WebSocket error occurred [ID: ${clientId}]`);
//       }
//     };
//   } else {
//     await next();
//   }
// });