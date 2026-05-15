import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { UIMessage } from "ai";

const ChatSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "New chat",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MessageSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    aiMessageId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["system", "user", "assistant"],
    },
    // Store the AI SDK message parts exactly as they arrive.
    // This keeps support for text, files, tool calls, reasoning, and future parts.
    parts: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    // Plain text copy for previews/search. The UI still renders from `parts`.
    text: {
      type: String,
      default: "",
    },
    finishReason: {
      type: String,
    },
    latencyMs: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ chatId: 1, aiMessageId: 1 }, { unique: true });
MessageSchema.index({ chatId: 1, createdAt: 1 });

export type ChatDocument = InferSchemaType<typeof ChatSchema>;
export type MessageDocument = InferSchemaType<typeof MessageSchema>;

export const ChatModel =
  mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

export function extractTextFromParts(parts: UIMessage["parts"]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function toUIMessage(message: MessageDocument): UIMessage {
  return {
    id: message.aiMessageId,
    role: message.role,
    parts: message.parts as UIMessage["parts"],
  };
}

export async function getChatMessages(chatId: string, userId: string) {
  const messages = await MessageModel.find({ chatId, userId }).sort({
    createdAt: 1,
  });

  return messages.map((message) => toUIMessage(message));
}
