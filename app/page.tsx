import { generateId } from "ai";
import ChatClient from "@/components/ChatClient";

export default function Page() {
  return (
    <ChatClient
      initialChatId={generateId()}
      redirectAfterFirstResponse
    />
  );
}
