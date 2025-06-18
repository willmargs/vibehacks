"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import ChatFeed from "./components/ChatFeed";
import AnimatedButton from "./components/AnimatedButton";
import Image from "next/image";
import posthog from "posthog-js";
import { clientSpeechToText, startRecording } from "./lib/speech-client";

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <span className="absolute hidden group-hover:block w-auto px-3 py-2 min-w-max left-1/2 -translate-x-1/2 translate-y-3 bg-gray-900 text-white text-xs rounded-md font-ppsupply">
        {text}
      </span>
    </div>
  );
};

export default function Home() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle CMD+Enter to submit the form when chat is not visible
      if (!isChatVisible && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }

      // Handle CMD+K to focus input when chat is not visible
      if (!isChatVisible && (e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector(
          'input[name="message"]'
        ) as HTMLInputElement;
        if (input) {
          input.focus();
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
  }, [isChatVisible]);

  const startChat = useCallback(
    (finalMessage: string) => {
      setInitialMessage(finalMessage);
      setIsChatVisible(true);

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

  const handleVoiceRecord = async () => {
    if (isRecording) return;

    setIsRecording(true);
    try {
      const { stop } = await startRecording();
      
      // Allow user to stop recording manually or auto-stop after 10 seconds
      const timeoutId = setTimeout(async () => {
        const audioBlob = await stop();
        await handleTranscription(audioBlob);
        setIsRecording(false);
      }, 10000);

      // Store stop function for manual control
      (window as any).stopVoiceRecording = async () => {
        clearTimeout(timeoutId);
        const audioBlob = await stop();
        await handleTranscription(audioBlob);
        setIsRecording(false);
        delete (window as any).stopVoiceRecording;
      };
    } catch (error) {
      console.error('Recording Error:', error);
      alert('Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopVoiceRecord = () => {
    if ((window as any).stopVoiceRecording) {
      (window as any).stopVoiceRecording();
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const result = await clientSpeechToText(audioBlob);
      setInputText(result.text);
    } catch (error) {
      console.error('Transcription Error:', error);
      alert('Failed to transcribe audio. Please check your OpenAI API key.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isChatVisible ? (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Top Navigation */}
          <nav className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Image
                src="/favicon.svg"
                alt="Open Operator"
                className="w-8 h-8"
                width={32}
                height={32}
              />
              <span className="font-ppsupply text-gray-900">Open Operator</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/browserbase/open-operator"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <button className="h-fit flex items-center justify-center px-4 py-2 rounded-md bg-[#1b2128] hover:bg-[#1d232b] gap-1 text-sm font-medium text-white border border-pillSecondary transition-colors duration-200">
                  <Image
                    src="/github.svg"
                    alt="GitHub"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  View GitHub
                </button>
              </a>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[640px] bg-white border border-gray-200 shadow-sm">
              <div className="w-full h-12 bg-white border-b border-gray-200 flex items-center px-4">
                <div className="flex items-center gap-2">
                  <Tooltip text="why would you want to close this?">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </Tooltip>
                  <Tooltip text="s/o to the 🅱️rowserbase devs">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  </Tooltip>
                  <Tooltip text="@pk_iv was here">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </Tooltip>
                </div>
              </div>

              <div className="p-8 flex flex-col items-center gap-8">
                <div className="flex flex-col items-center gap-3">
                  <h1 className="text-2xl font-ppneue text-gray-900 text-center">
                    Vision
                  </h1>
                  <p className="text-base font-ppsupply text-gray-500 text-center">
                    Give your voice a vision.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const message = inputText.trim();
                    const finalMessage = message || "What's the price of NVIDIA stock?";
                    startChat(finalMessage);
                  }}
                  className="w-full max-w-[720px] flex flex-col items-center gap-3"
                >
                  <div className="relative w-full">
                    <input
                      name="message"
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="What's the price of NVIDIA stock?"
                      className="w-full px-4 py-3 pr-[180px] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF3B00] focus:border-transparent font-ppsupply"
                      disabled={isRecording || isTranscribing}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={isRecording ? stopVoiceRecord : handleVoiceRecord}
                        disabled={isTranscribing}
                        className={`px-4 py-2 text-sm font-medium rounded transition-colors border ${
                          isRecording
                            ? 'bg-red-500 text-white hover:bg-red-600 border-red-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600 border-blue-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isRecording ? '🔴 Stop' : '🎤 Voice'}
                      </button>
                      <AnimatedButton type="submit" disabled={isRecording || isTranscribing}>
                        {isTranscribing ? 'Processing...' : 'Run'}
                      </AnimatedButton>
                    </div>
                  </div>
                  {isRecording && (
                    <p className="text-sm text-red-600 font-ppsupply">
                      🎤 Recording... Click "Stop" or speak for up to 10 seconds
                    </p>
                  )}
                  {isTranscribing && (
                    <p className="text-sm text-blue-600 font-ppsupply">
                      🔄 Converting speech to text...
                    </p>
                  )}
                </form>
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
            <p className="text-base font-ppsupply text-center mt-8">
              Powered by{" "}
              <a
                href="https://stagehand.dev"
                className="text-yellow-600 hover:underline"
              >
                🤘 Stagehand
              </a>{" "}
              on{" "}
              <a
                href="https://browserbase.com"
                className="text-[#FF3B00] hover:underline"
              >
                🅱️ Browserbase
              </a>
              .
            </p>
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
