import { handle } from "hono/aws-lambda";
import { registerContainer } from "../../di-container/register-container.js";
import { buildApp } from "./app.js";

const container = registerContainer();
const app = buildApp({ container });

export const handler = handle(app);
