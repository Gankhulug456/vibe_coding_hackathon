"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { chatWithAssistant } from "@/ai/flows/assistant-chat";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "model";
  content: string;
};

export function AiChat() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendPrompt = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: prompt };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await chatWithAssistant({
        history: newMessages,
        language,
      });
      if (result.response) {
        const aiMessage: Message = { role: "model", content: result.response };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } else {
        throw new Error(t("messages.errorOccurred"));
      }
    } catch (error: any) {
      console.error("Error calling AI assistant:", error);
      toast({
        title: t("messages.errorOccurred"),
        description:
          error.message ||
          "AI request failed on the server. Please check the Vercel deployment logs (Functions tab) for a detailed error message. This is likely due to a missing or incorrect GOOGLE_API_KEY environment variable.",
        variant: "destructive",
      });
      setMessages((prevMessages) =>
        prevMessages.filter((m) => m !== userMessage)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(inputValue);
  };

  const getInitials = (name: string = "User") => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  const typingDotVariants = {
    initial: { y: "0%" },
    animate: { y: "-100%" },
  };

  const typingDotTransition = {
    duration: 0.4,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Fixed Header */}
      <div className="shrink-0 px-4 pt-4 pb-4 md:px-6 border-b z-10 bg-card">
        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          {t("navigation.aiAssistant")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("features.aiChatbot.description")}
        </p>
      </div>

      {/* Scrolling Message List */}
      <div
        className="flex-1 space-y-6 overflow-y-auto min-h-0 px-4 pt-4 md:px-6 md:pt-6 pb-28"
        ref={scrollAreaRef}
      >
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground p-4">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              {t("features.aiChatbot.examplePrompts.title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => {
                const titleKey = `features.aiChatbot.examplePrompts.prompt${
                  i + 1
                }.title`;
                const promptKey = `features.aiChatbot.examplePrompts.prompt${
                  i + 1
                }.prompt`;
                const titleText = t(titleKey);
                const promptText = t(promptKey);
                return (
                  <button
                    key={i}
                    onClick={() => handleSendPrompt(promptText)}
                    className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-left text-sm text-card-foreground transition-colors"
                  >
                    <p className="font-semibold">{titleText}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {promptText}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex items-start gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "model" && (
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-md rounded-lg p-3 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm dark:prose-invert max-w-none 
                                prose-p:my-0 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-blockquote:my-2"
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="h-9 w-9 border">
                  <AvatarImage
                    src={user?.avatarUrl || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback>
                    {getInitials(user?.name || "User")}
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 justify-start"
          >
            <Avatar className="h-9 w-9 border">
              <AvatarFallback>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="max-w-md rounded-lg p-3 text-sm bg-muted flex items-center justify-center gap-1.5 h-full">
              <motion.span
                className="h-2 w-2 bg-foreground rounded-full"
                variants={typingDotVariants}
                animate="animate"
                transition={{ ...typingDotTransition, delay: 0 }}
              />
              <motion.span
                className="h-2 w-2 bg-foreground rounded-full"
                variants={typingDotVariants}
                animate="animate"
                transition={{ ...typingDotTransition, delay: 0.2 }}
              />
              <motion.span
                className="h-2 w-2 bg-foreground rounded-full"
                variants={typingDotVariants}
                animate="animate"
                transition={{ ...typingDotTransition, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:px-6 bg-gradient-to-t from-card via-card/90 to-transparent pointer-events-none">
        <form
          onSubmit={handleFormSubmit}
          className="relative pointer-events-auto"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("features.aiChatbot.placeholder")}
            className="w-full rounded-full bg-background border shadow-lg py-6 pl-5 pr-16"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
