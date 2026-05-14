import { streamText, type UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  console.log(JSON.stringify(messages));

  const result = streamText({
    model: "openai/gpt-5-mini",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
