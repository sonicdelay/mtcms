/// <reference lib="deno.ns" />
import db from "https://jsr.io/@std/media-types/1.1.0/vendor/db.ts";
import { Node } from "../../models/node.interface.ts";
import { getByEmail } from "./nodes.service.js";
import bcrypt from "bcryptjs";
import * as jose from "jose";

const jwtSecret = process.env.JWT_SECRET ||
  "1f5e6a1ccd833d0e6a82a832a5c08671";
const alg = "HS256";

const whitelist = [
  "",
];

export const authByEmail = (email: string, password: string) => {
  return new Promise<Node>((resolve, reject) => {
    getByEmail(email).then((node: Node) => {
      if (!node) {
        reject(new Error("Invalid credentials"));
        return;
      }
      const dbPassword = node.data[0].values.en.password ?? "";
      if (bcrypt.compareSync(password, dbPassword)) {
        resolve(node as Node);
      } else {
        reject(new Error("Invalid credentials"));
      }
    }).catch((err: Error) => {
      console.log(err);
      reject(new Error("Invalid credentials"));
    });
  });
};

export const createToken = async (node: Node) => {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    user: {
      id: node.id,
      email: node.data[0].values.en.email,
      role: node.data[0].values.en.role,
    },
  };
  const secret = new TextEncoder().encode(
    jwtSecret,
  );

  const jwt = await new jose.SignJWT({ "claim": true, ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer("https://www.sonicdelay.net")
    .setAudience("mtcms")
    .setExpirationTime("2h")
    .sign(secret);
  return jwt;
};

export const validateToken = (token: string) => {
  return new Promise<Node>((resolve, reject) => {
    const secret = new TextEncoder().encode(
      jwtSecret,
    );
    // console.log(token);
    jose.jwtVerify(token, secret, {
      issuer: "https://www.sonicdelay.net",
      audience: "mtcms",
    }).then((result) => {
      resolve(result.payload as any);
    }).catch((err) => {
      //console.log(err, "ERROR VALIDATING TOKEN...");
      reject(new Error(`Invalid token: ${err.message}`));
    });
  });
};
