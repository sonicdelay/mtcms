export type CreateNodeInput = {
  id: string;
  type: "file" | "directory";
  update?: Date;
  sync: unknown;
  data?: unknown;
};
