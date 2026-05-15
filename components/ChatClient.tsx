"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";

function getText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export default function ChatClient({
  initialChatId,
  initialMessages = [],
  redirectAfterFirstResponse = false,
}: {
  initialChatId: string;
  initialMessages?: UIMessage[];
  redirectAfterFirstResponse?: boolean;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const chatId = initialChatId;

  const { messages, sendMessage, status } = useChat({
    id: chatId,
    messages: initialMessages,
    onFinish() {
      if (redirectAfterFirstResponse) {
        router.replace(`/chat/${chatId}`);
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <div className="mb-4 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <div>
          <span className="font-medium">Chat id:</span> {chatId}
        </div>
        <div className="mt-1">
          Mongo stores one document in <code>chats</code>, then one document per
          turn in <code>messages</code> using this id.
        </div>
      </div>

      <div className="flex-1 space-y-4 pb-28">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Send a message. The API route will create the chat session, save
            your message, stream the reply, then save the assistant message.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="mb-2 text-xs font-medium uppercase text-zinc-500">
                {message.role} message
              </div>
              <div className="whitespace-pre-wrap text-sm leading-6">
                {getText(message)}
              </div>
              <details className="mt-3 text-xs text-zinc-500">
                <summary className="cursor-pointer">Stored parts JSON</summary>
                <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-3 dark:bg-zinc-900">
                  {JSON.stringify(message.parts, null, 2)}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>

      <form
        className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black"
        onSubmit={(event) => {
          event.preventDefault();

          if (!input.trim() || isBusy) return;

          sendMessage({ text: input });
          setInput("");
        }}
      >
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
            value={input}
            placeholder="Say something..."
            onChange={(event) => setInput(event.currentTarget.value)}
          />
          <button
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
            disabled={isBusy}
            type="submit"
          >
            Send
          </button>
        </div>
      </form>
    </main>
  );
}
