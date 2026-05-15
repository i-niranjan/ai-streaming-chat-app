import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ChatClient from "@/components/ChatClient";
import { ChatModel, getChatMessages } from "@/lib/db/chat";
import { connectDB } from "@/lib/db/mongoose";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const ownerId = userId ?? "anonymous";

  await connectDB();

  const chat = await ChatModel.findOne({ _id: id, userId: ownerId });

  if (!chat) {
    notFound();
  }

  const messages = await getChatMessages(id, ownerId);

  return <ChatClient initialChatId={id} initialMessages={messages} />;
}
