import { useState, useRef, useCallback } from "react";
import { chatsAPI } from "@/lib/api";
import { toast } from "sonner";

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition?: new () => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition?: new () => any;
  }
}

// Voice Input Hook (Custom Backend Transcription Fallback)
export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setError(null);
      setTranscript("");
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err?.message?.includes("Permission denied")) {
        setError("Microphone access denied. Please allow microphone permission in your browser settings.");
      } else {
        setError(`Microphone error: ${err?.message || "Unknown error"}`);
      }
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        const currentRecorder = mediaRecorderRef.current;

        currentRecorder.onstop = async () => {
          setIsListening(false);
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          toast.info("Transcribing audio...", { id: "transcribe" });

          try {
            const res = await chatsAPI.transcribe(audioBlob);
            const transcribedText = res.text || "";
            setTranscript(transcribedText);
            toast.success("Transcription complete!", { id: "transcribe" });
            resolve(transcribedText);
          } catch (err: any) {
            const errorMessage = err.message || "Failed to transcribe audio. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage, { id: "transcribe" });
            resolve("");
          }

          // Stop all microphone tracks
          currentRecorder.stream.getTracks().forEach((track) => track.stop());
        };

        currentRecorder.stop();
      } else {
        setIsListening(false);
        resolve("");
      }
    });
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

// Text-to-Speech Hook
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    // Check browser support
    if (!window.speechSynthesis) {
      setError("Text-to-Speech not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = 1;
    utteranceRef.current.pitch = 1;
    utteranceRef.current.volume = 1;

    utteranceRef.current.onstart = () => {
      setIsSpeaking(true);
      setError(null);
    };

    utteranceRef.current.onend = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current.onerror = (event: any) => {
      setError(`Speech error: ${event.error}`);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utteranceRef.current);
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.paused === false) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.paused === true) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    isSpeaking,
    error,
    speak,
    stop,
    pause,
    resume,
  };
};
