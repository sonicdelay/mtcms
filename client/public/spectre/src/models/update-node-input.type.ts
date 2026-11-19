export type UpdateNodeInput = {
  type?: 'file' | 'directory';
  update?: Date;
  sync?: unknown;
  data?: unknown;
};