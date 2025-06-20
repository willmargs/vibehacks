"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import ChatFeed from "./components/ChatFeed";
import posthog from "posthog-js";

export default function Home() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [initialMessage, setInitialMessage] = useState("test message");
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle CMD+Enter to submit when chat is not visible
      if (!isChatVisible && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        setIsListening(false);
        if (message.trim()) {
          startChat(message);
        }
      }

      // Handle CMD+K to focus textarea when chat is not visible
      if (!isChatVisible && (e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }

      // Handle ESC to close chat when visible
      if (isChatVisible && e.key === "Escape") {
        e.preventDefault();
        setIsChatVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatVisible, message]);

  const handleSubmit = () => {
    if (message.trim()) {
      startChat(message);
    }
  };

  const startChat = useCallback(
    (finalMessage: string) => {
      console.log("submitting chat:", finalMessage);
      setInitialMessage(finalMessage);
      setIsChatVisible(true);
      setMessage(""); // Clear the message after starting chat

      try {
        posthog.capture("submit_message", {
          message: finalMessage,
        });
      } catch (e) {
        console.error(e);
      }
    },
    [setInitialMessage, setIsChatVisible]
  );

  return (
    <AnimatePresence mode="wait">
      {!isChatVisible ? (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[640px] bg-white border border-gray-200 shadow-sm">

              <div className="p-8 flex flex-col items-center gap-8">
                <div className="flex flex-col items-center gap-3">
                  {/* Listen Button */}
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-ppsupply transition-all duration-200 ${
                      isListening 
                        ? 'bg-[#FF3B00] text-white hover:bg-[#E63500]' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`} 
                    onClick={() => {
                      if (!isListening) {
                        setIsListening(true);
                      } else {
                        handleSubmit();
                        setIsListening(false);
                      }
                    }}
                  >
                    {isListening ? (
                      <>
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        Listening...
                      </>
                    ) : (
                      'Start Listening'
                    )}
                  </button>
                </div>

                <div className="w-full max-w-[720px] flex flex-col items-center gap-3">
                  <div className="relative w-full">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What's the price of NVIDIA stock?"
                      className="w-full px-4 py-3 pr-[100px] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF3B00] focus:border-transparent font-ppsupply resize-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() =>
                      startChat(
                        "Who is the top GitHub contributor to Stagehand by Browserbase?"
                      )
                    }
                    className="p-3 text-sm text-gray-600 border border-gray-200 hover:border-[#FF3B00] hover:text-[#FF3B00] transition-colors font-ppsupply text-left"
                  >
                    Who is the top contributor to Stagehand?
                  </button>
                  <button
                    onClick={() =>
                      startChat("How many wins do the 49ers have?")
                    }
                    className="p-3 text-sm text-gray-600 border border-gray-200 hover:border-[#FF3B00] hover:text-[#FF3B00] transition-colors font-ppsupply text-left"
                  >
                    How many wins do the 49ers have?
                  </button>
                  <button
                    onClick={() => startChat("What is Stephen Curry's PPG?")}
                    className="p-3 text-sm text-gray-600 border border-gray-200 hover:border-[#FF3B00] hover:text-[#FF3B00] transition-colors font-ppsupply text-left"
                  >
                    What is Stephen Curry&apos;s PPG?
                  </button>
                  <button
                    onClick={() => startChat("How much is NVIDIA stock?")}
                    className="p-3 text-sm text-gray-600 border border-gray-200 hover:border-[#FF3B00] hover:text-[#FF3B00] transition-colors font-ppsupply text-left"
                  >
                    How much is NVIDIA stock?
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <ChatFeed
          initialMessage={initialMessage}
          onClose={() => setIsChatVisible(false)}
        />
      )}
    </AnimatePresence>
  );
}
