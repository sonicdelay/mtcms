import { createElement as h, useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";

const SpeechRecognitionApi =
  window.SpeechRecognition || window.webkitSpeechRecognition;

function cleanForTTS(text) {
  return text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/[*_~`#>|\\[\](){}<>^=+-]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [autoTTS, setAutoTTS] = useState(false);
  const [thinking, setThinking] = useState("low");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [autoSend, setAutoSend] = useState(true);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const loadingRef = useRef(false);
  const autoTTSRef = useRef(false);
  const conversationModeRef = useRef(false);
  const autoSendRef = useRef(true);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    autoTTSRef.current = autoTTS;
  }, [autoTTS]);

  useEffect(() => {
    autoSendRef.current = autoSend;
  }, [autoSend]);

  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      setVoices(available);
      if (!selectedVoice && available.length) {
        const de = available.find((v) => v.lang.startsWith("de"));
        setSelectedVoice((de || available[0]).name);
      }
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () =>
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const submitText = async (rawText) => {
    const text = rawText.trim();
    if (!text || loadingRef.current) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userName: "WebUser", thinking })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "error", content: data.error || "Request failed" }
        ]);
      } else {
        setMessages((prev) => {
          const next = [...prev, { role: "assistant", content: data.reply }];
          if (autoTTSRef.current) {
            speechSynthesis.cancel();
            const utterance = createUtterance(data.reply);
            const idx = next.length - 1;
            setSpeakingIndex(idx);
            const resumeListening = () => {
              setSpeakingIndex(null);
              if (conversationModeRef.current && recognitionRef.current) {
                conversationModeRef.current = false;
                try {
                  recognitionRef.current.start();
                } catch {
                  // recognition is already started — nothing to do
                }
              }
            };
            utterance.onend = resumeListening;
            utterance.onerror = () => setSpeakingIndex(null);
            speechSynthesis.speak(utterance);
          }
          return next;
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Network error: " + err.message }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    await submitText(input);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!SpeechRecognitionApi) return;

    const recognition = new SpeechRecognitionApi();
    recognition.lang = navigator.language || "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let silenceTimer = null;
    let fullTranscript = "";

    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, 2000);
    };

    recognition.onstart = () => {
      setSpeechError("");
      setListening(true);
      fullTranscript = "";
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = null;
      setListening(false);
      const text = fullTranscript.trim();
      if (text) {
        if (autoSendRef.current) {
          conversationModeRef.current = autoTTSRef.current;
          submitText(text);
        } else {
          setInput(text);
        }
      }
      fullTranscript = "";
    };

    recognition.onerror = (event) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = null;
      setListening(false);
      fullTranscript = "";
      if (event.error === "no-speech") {
        setSpeechError("Keine Sprache erkannt. Bitte erneut versuchen.");
        return;
      }

      if (event.error === "not-allowed") {
        setSpeechError("Mikrofonzugriff nicht erlaubt.");
        return;
      }

      setSpeechError("Spracheingabe fehlgeschlagen: " + event.error);
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalParts = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalParts += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      fullTranscript = finalParts;
      setInput(finalParts + interim);
      resetSilenceTimer();
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const createUtterance = (text) => {
    const utterance = new SpeechSynthesisUtterance(cleanForTTS(text));
    const voice = speechSynthesis
      .getVoices()
      .find((v) => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = navigator.language || "de-DE";
    }
    return utterance;
  };

  const toggleTTS = (index, text) => {
    if (speakingIndex === index) {
      speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    speechSynthesis.cancel();
    const utterance = createUtterance(text);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    speechSynthesis.speak(utterance);
  };

  const toggleSpeechInput = () => {
    const recognition = recognitionRef.current;
    if (!recognition || loading) return;

    setSpeechError("");

    if (listening) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSpeechError("Spracheingabe konnte nicht gestartet werden: " + msg);
    }
  };

  return h(
    "div",
    { className: "app" },
    h(
      "div",
      { id: "chat", ref: chatRef },
      messages.map((msg, i) =>
        msg.role === "assistant"
          ? h(
              "div",
              { key: i, className: "msg assistant" },
              msg.content,
              h(
                "button",
                {
                  className:
                    speakingIndex === i ? "tts-btn speaking" : "tts-btn",
                  onClick: () => toggleTTS(i, msg.content)
                },
                speakingIndex === i ? "⏹" : "🔊"
              )
            )
          : h("div", { key: i, className: `msg ${msg.role}` }, msg.content)
      ),
      loading && h("div", { className: "msg thinking" }, "Thinking...")
    ),
    speechSupported &&
      h(
        "div",
        { className: "speech-status" },
        listening
          ? "Spracheingabe aktiv. Bitte sprechen..."
          : speechError || "Spracheingabe bereit."
      ),
    !speechSupported &&
      h(
        "div",
        { className: "speech-status" },
        "Spracheingabe wird von diesem Browser nicht unterstuetzt."
      ),
    h(
      "form",
      { onSubmit: send },
      h("input", {
        value: input,
        onChange: (e) => setInput(e.target.value),
        placeholder: "Type a message...",
        disabled: loading,
        autoFocus: true
      }),
      h(
        "select",
        {
          className: "thinking-select",
          value: thinking,
          onChange: (e) => setThinking(e.target.value)
        },
        h("option", { value: "low" }, "Low"),
        h("option", { value: "medium" }, "Medium"),
        h("option", { value: "high" }, "High")
      ),
      voices.length > 0 &&
        h(
          "select",
          {
            className: "voice-select",
            value: selectedVoice,
            onChange: (e) => setSelectedVoice(e.target.value)
          },
          voices.map((v) =>
            h(
              "option",
              { key: v.name, value: v.name },
              v.name + " (" + v.lang + ")"
            )
          )
        ),
      h(
        "button",
        {
          type: "button",
          className: autoTTS ? "auto-tts-btn active" : "auto-tts-btn",
          onClick: () => setAutoTTS((v) => !v)
        },
        autoTTS ? "🔊 Auto" : "🔇 Auto"
      ),
      speechSupported &&
        h(
          "button",
          {
            type: "button",
            className: autoSend ? "auto-tts-btn active" : "auto-tts-btn",
            onClick: () => setAutoSend((v) => !v)
          },
          autoSend ? "⚡ Auto" : "✋ Manuell"
        ),
      speechSupported &&
        h(
          "button",
          {
            type: "button",
            className: listening ? "mic-btn listening" : "mic-btn",
            onClick: toggleSpeechInput,
            disabled: loading
          },
          listening ? "Stop Mic" : "Mic"
        ),
      h(
        "button",
        { type: "submit", disabled: loading || !input.trim() },
        "Send"
      )
    )
  );
}

createRoot(document.getElementById("root")).render(h(App));
