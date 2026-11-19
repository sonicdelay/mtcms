import {
  CreateFileRecordInput,
  FileRecord,
  FileRecordRepository,
  UpdateFileRecordInput
} from "./file-record.repository.ts";

const notConfiguredError = (): Error => {
  return new Error(
    "Postgres repository is not configured. Set FILE_MANAGER_REPOSITORY=fs or implement pg client wiring."
  );
};

export const createPostgresFileRecordRepository = (): FileRecordRepository => {
  return {
    findAll: async (): Promise<FileRecord[]> => {
      throw notConfiguredError();
    },
    findById: async (_id: string): Promise<FileRecord | null> => {
      throw notConfiguredError();
    },
    create: async (_input: CreateFileRecordInput): Promise<FileRecord> => {
      throw notConfiguredError();
    },
    update: async (
      _id: string,
      _input: UpdateFileRecordInput
    ): Promise<FileRecord | null> => {
      throw notConfiguredError();
    },
    remove: async (_id: string): Promise<boolean> => {
      throw notConfiguredError();
    }
  };
};
