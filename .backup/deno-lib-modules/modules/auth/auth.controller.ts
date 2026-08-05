import { authByEmail, createToken, validateToken } from "../../auth.service.js";
import { RouterContext } from "jsr:@oak/oak";
import { getNodeById } from "../../nodes.service.js";


export const authenticateByEmail = async (ctx: RouterContext<"/">) => {
  const form = await ctx.request.body.formData();
  const email: string = form.get("email") as string;
  const password: string = form.get("password") as string;

  if (typeof email !== "string") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid email" };
    return;
  }
  if (typeof password !== "string") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid password" };
    return;
  }
  try {
    const node = await authByEmail(email, password);
    if (!node) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid credentials" };
      return;
    }
    try {
      const token = await createToken(node);
      ctx.response.headers.set("Content-Type", "application/json");
      ctx.response.status = 200;
      ctx.response.body = { token };

    } catch (err) {
      console.error(err);
      ctx.response.status = 500;
      ctx.response.body = { error: "An error occurred" };
      ctx.response.headers.set("Content-Type", "application/json");
    }
    return node;
  } catch (err) {
    ctx.response.status = 404;
    ctx.response.body = "404 Not Found";
    return;
  }
};

export const refreshToken = async (ctx: RouterContext<"/">) => {
  const token = ctx.request.headers.get("Authorization")?.substring(7) ?? "";
  if (token == "") {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid token" };
    return;
  }
  await validateToken(token)
    .then(async (node: any) => {
      const newnode = await getNodeById(node.user.id);
      if (!newnode) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Invalid credentials" };
        return;
      }
      try {
        const token = await createToken(newnode);
        ctx.response.headers.set("Content-Type", "application/json");
        ctx.response.status = 200;
        ctx.response.body = { token };
      } catch (err) {
        console.error(err);
        ctx.response.status = 500;
        ctx.response.body = { error: "An error occurred" };
        ctx.response.headers.set("Content-Type", "application/json");
      }
      return newnode;
    })
}
