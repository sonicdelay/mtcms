import fs from "fs";

export const logger = (message: string) => {
  const timestamp = new Date().toISOString();
  fs.appendFile("./logs/ollama.log", `${timestamp} - ${message}\n`, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });
};
