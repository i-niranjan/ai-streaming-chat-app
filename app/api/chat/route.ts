import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { auth } from "@clerk/nextjs/server";
import {
  ChatModel,
  extractTextFromParts,
  MessageModel,
} from "@/lib/db/chat";
import { connectDB } from "@/lib/db/mongoose";

export async function POST(req: Request) {
  const startedAt = Date.now();
  const body: { id: string; messages: UIMessage[] } = await req.json();
  const { userId } = await auth();
  const ownerId = userId ?? "anonymous";
  const { id: chatId, messages } = body;

  if (!chatId || !messages?.length) {
    return Response.json({ error: "Missing chat id or messages" }, { status: 400 });
  }

  await connectDB();

  const latestMessage = messages[messages.length - 1];

  if (latestMessage.role === "user") {
    const latestText = extractTextFromParts(latestMessage.parts);

    await ChatModel.findByIdAndUpdate(
      chatId,
      {
        $setOnInsert: {
          _id: chatId,
          userId: ownerId,
          title: latestText.slice(0, 80) || "New chat",
        },
        $set: {
          lastMessageAt: new Date(),
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await MessageModel.updateOne(
      { chatId, aiMessageId: latestMessage.id },
      {
        $setOnInsert: {
          chatId,
          userId: ownerId,
          aiMessageId: latestMessage.id,
          role: latestMessage.role,
          parts: latestMessage.parts,
          text: latestText,
        },
      },
      { upsert: true }
    );
  }

  const result = streamText({
    model: "openai/gpt-5-mini",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    async onFinish({ responseMessage, finishReason }) {
      const latencyMs = Date.now() - startedAt;

      await MessageModel.updateOne(
        { chatId, aiMessageId: responseMessage.id },
        {
          $setOnInsert: {
            chatId,
            userId: ownerId,
            aiMessageId: responseMessage.id,
          },
          $set: {
            role: responseMessage.role,
            parts: responseMessage.parts,
            text: extractTextFromParts(responseMessage.parts),
            finishReason,
            latencyMs,
          },
        },
        { upsert: true }
      );

      await ChatModel.findByIdAndUpdate(chatId, {
        $set: {
          lastMessageAt: new Date(),
        },
      });
    },
  });
}
