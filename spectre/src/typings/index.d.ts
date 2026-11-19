import { ActionBus } from "../action-bus.ts";

declare module "*.txt" {
  const value: string;
  export default value;
}

declare module "*.md" {
  const value: string;
  export default value;
}

declare global {
  namespace Express {
    interface Application {
      get(name: "actions"): ActionBus;
      set(name: "actions", value: ActionBus): this;
    }
  }
}
