import { useState, useRef, useCallback } from "react";

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

// Voice Input Hook
export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in this browser");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + text + " ");
        } else {
          interim += text;
        }
      }
      // we don't touch DOM directly; consumer of the hook can react to transcript state
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore "aborted" error - it occurs when user manually stops recording
      // or when the browser stops recognition normally
      if (event.error === "aborted") {
        setIsListening(false);
        return;
      }
      
      // Handle "not-allowed" error (permission denied)
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permission in your browser settings.");
        setIsListening(false);
        return;
      }
      
      // Handle "no-speech" error (no speech detected)
      if (event.error === "no-speech") {
        setError("No speech detected. Please try speaking again.");
        setIsListening(false);
        return;
      }
      
      // Handle "network" error
      if (event.error === "network") {
        setError("Network error. Please check your internet connection and try again.");
        setIsListening(false);
        return;
      }
      
      // Handle other errors
      setError(`Microphone error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
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
