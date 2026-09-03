import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AudioLines } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";
import { buildCoachContext } from "@/lib/coach-context";
import { CoachActions } from "@/components/CoachActions";

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function CoachChat({
  threadId,
  initialMessages,
  userId,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  userId: string;
}) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [context, setContext] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    void buildCoachContext().then(setContext);
  }, [threadId]);

  const persist = useCallback(
    async (role: "user" | "assistant", content: string) => {
      if (!content) return;
      const { error } = await supabase
        .from("chat_messages")
        .insert({ thread_id: threadId, user_id: userId, role, content });
      if (error) toast.error("Could not save that message.");
    },
    [threadId, userId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: msgs }) => ({ body: { messages: msgs, context } }),
    }),
    onFinish: ({ message }) => {
      void persist("assistant", textOf(message));
    },
    onError: (e) => toast.error(e.message || "The coach could not answer just now."),
  });

  const busy = status === "submitted" || status === "streaming";

  const focusInput = useCallback(() => textareaRef.current?.focus(), []);
  useEffect(() => {
    focusInput();
  }, [threadId, focusInput]);
  useEffect(() => {
    if (!busy) focusInput();
  }, [busy, focusInput]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    void persist("user", trimmed);
    if (messages.length === 0) {
      await supabase
        .from("chat_threads")
        .update({ title: trimmed.slice(0, 60), updated_at: new Date().toISOString() })
        .eq("id", threadId);
      void qc.invalidateQueries({ queryKey: ["chat-threads", userId] });
    }
    void sendMessage({ text: trimmed });
    focusInput();
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-2xl">
          {messages.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-signal/40 bg-signal/10">
                <AudioLines className="h-6 w-6 text-signal" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">Ask your hearing coach</h2>
               <p className="mt-2 text-sm text-muted-foreground">
                 It reads your screenings, imported clinic reports, training sessions and device setup.
               </p>
               <CoachActions onSelect={(prompt) => void send(prompt)} />
            </div>
          ) : null}

          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent
                className={
                  m.role === "assistant" ? "bg-transparent p-0 text-foreground" : undefined
                }
              >
                <MessageResponse>{textOf(m)}</MessageResponse>
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" ? (
            <Shimmer className="px-1 text-sm">Reading your hearing data...</Shimmer>
          ) : null}
          {error ? (
            <p className="px-1 text-sm text-danger">{error.message}</p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-2xl px-4 pb-6">
        <PromptInput
          onSubmit={(_msg, e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your progress, your risks, or what to do next..."
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
