import { auth } from "@clerk/nextjs/server";
import { ChatModel, getChatMessages } from "@/lib/db/chat";
import { connectDB } from "@/lib/db/mongoose";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { userId } = await auth();
  const ownerId = userId ?? "anonymous";

  await connectDB();

  const chat = await ChatModel.findOne({ _id: id, userId: ownerId }).lean();

  if (!chat) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = await getChatMessages(id, ownerId);

  return Response.json({
    chat,
    messages,
  });
}
