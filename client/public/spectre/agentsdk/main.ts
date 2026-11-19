import OpenAI from "openai";
import { Agent, run, OpenAIResponsesModel } from "@openai/agents";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "lm-studio",
  baseURL: "http://127.0.0.1:1234/v1/",

});

const agent = new Agent({
  name: "Code sAssistant",
  instructions: "You are a helpful assistant.",
  model: new OpenAIResponsesModel(client, "gemma-4-e4b-uncensored-hauhaucs-aggressive"),
  modelSettings: {
    temperature: 0.7,
    reasoning: {
      // maxSteps: 5,
      // maxTokens: 2000,
      effort: "low",
    }
  }
});

const result = await run(agent, "Explain pythagorean theorem.");

console.log(result.finalOutput);

