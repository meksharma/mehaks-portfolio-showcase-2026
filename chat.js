/* ============================================================
   Simulated AI Chat — scripted responder
   --------------------------------------------------------------
   This mimics a real streaming AI assistant but answers from a
   local knowledge base. To switch to a real AI later, replace
   `generateResponse()` with a fetch() call to your backend and
   keep the same streaming render (streamInto).
   ============================================================ */
(function () {
  "use strict";

  // ---- Knowledge base: intent → answer ------------------------
  // Each entry has keywords to match and a scripted answer.
  const KB = [
    {
      keys: ["who", "about", "yourself", "tell me", "intro", "you"],
      answer:
        "I'm Mehak — a lead product designer with ten years of craft, taste, and vibe-coding fluency. Right now I design AI experiences inside Microsoft Outlook, and I'm based in Shanghai.",
    },
    {
      keys: ["outlook", "summarize", "ai", "copilot", "microsoft"],
      answer:
        "At Microsoft I own the **Summarize** experience in Outlook Mobile — one of Copilot's strongest features, with 2.3M+ users on iOS alone. I joined as the first principal designer in Aug 2024 and have driven it end-to-end: introducing AI to Outlook mobile for the first time, integrating it into Copilot Chat, and now prototyping how AI proactively surfaces above the inbox.",
    },
    {
      keys: ["agoda", "booking", "loyalty", "travel"],
      answer:
        "Before Microsoft I designed Agoda's loyalty program (part of Booking Holdings) to drive deeper app engagement.",
    },
    {
      keys: ["sap", "b2b", "enterprise", "privacy"],
      answer:
        "At SAP I built B2B tools spanning project management and data privacy — helping users manage their time and control their data.",
    },
    {
      keys: ["work", "process", "how do you", "approach", "philosophy", "method"],
      answer:
        "Three principles guide how I work:\n\n**Research with intent** — uncover decision-making moments, not just preferences.\n**Design systems as leverage** — turn findings into reusable patterns that scale.\n**Narrative-driven delivery** — align teams through clear rationale and measurable outcomes.",
    },
    {
      keys: ["vibe", "coding", "prototype", "code", "build", "prototyping"],
      answer:
        "I vibe-code my prototypes — bringing a vision to life beyond static mockups. On Summarize Phase 3 I experimented with vibe-coded design flows, prompt engineering, ran experiments, and tracked daily usage to refine AI output quality.",
    },
    {
      keys: ["location", "where", "based", "shanghai", "live"],
      answer: "I'm based in Shanghai, collaborating globally across product organizations.",
    },
    {
      keys: ["contact", "hire", "email", "reach", "linkedin", "available", "opportunit"],
      answer:
        "I'm open to senior UX and design strategy opportunities. You can reach me at **meksharma@gmail.com** or on LinkedIn (/in/meksharma).",
    },
    {
      keys: ["experience", "years", "long", "career"],
      answer:
        "Ten years across AI, consumer, and enterprise — Microsoft (Outlook + AI), Agoda (BKNG), and SAP.",
    },
  ];

  const FALLBACK =
    "Great question! I'm a simulated version of Mehak's assistant, so I know about her work at Microsoft Outlook, Agoda and SAP, how she works, and how to get in touch. Try asking about the Summarize project, her design process, or how to reach her.";

  const SUGGESTIONS = [
    "Who is Mehak?",
    "Tell me about the Summarize project",
    "How does she work?",
    "How can I reach her?",
  ];

  function generateResponse(text) {
    const q = text.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const entry of KB) {
      let score = 0;
      for (const k of entry.keys) {
        if (q.includes(k)) score += k.length; // longer matches weigh more
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best ? best.answer : FALLBACK;
  }

  // ---- Tiny markdown (bold + line breaks), escaped --------------
  function render(md) {
    const esc = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return esc
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  // ---- Build DOM ------------------------------------------------
  const launcher = document.createElement("div");
  launcher.className = "chat-launcher";
  launcher.innerHTML = `
    <form class="chat-launcher-form" autocomplete="off">
      <span class="chat-launcher-spark" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.5l1.6 4.9a5 5 0 0 0 3 3L21.5 12l-4.9 1.6a5 5 0 0 0-3 3L12 21.5l-1.6-4.9a5 5 0 0 0-3-3L2.5 12l4.9-1.6a5 5 0 0 0 3-3L12 2.5z"/>
        </svg>
      </span>
      <input class="chat-launcher-input" type="text" placeholder="Ask me something…" aria-label="Ask the assistant" />
      <button class="chat-send chat-launcher-send" type="submit" aria-label="Send">↑</button>
    </form>`;
  document.body.appendChild(launcher);

  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with Mehak");
  panel.innerHTML = `
    <div class="chat-panel-head">
      <div>
        <p class="chat-panel-title">Chat with Mehak</p>
        <p class="chat-panel-sub">Simulated assistant · demo</p>
      </div>
      <button class="chat-close" aria-label="Close chat">×</button>
    </div>
    <div class="chat-log" aria-live="polite">
      <p class="chat-welcome">👋 Hi! I'm a simulated version of <strong>Mehak's</strong> assistant. Ask me about her work, design process, or how to get in touch.</p>
    </div>
    <div class="chat-suggestions"></div>
    <form class="chat-composer" autocomplete="off">
      <input type="text" placeholder="Ask me something…" aria-label="Type your message" />
      <button class="chat-send" type="submit" aria-label="Send">↑</button>
    </form>`;
  document.body.appendChild(panel);

  const launcherForm = launcher.querySelector(".chat-launcher-form");
  const launcherInput = launcher.querySelector(".chat-launcher-input");
  launcherInput.addEventListener("input", () => {
    launcherForm.classList.toggle("has-text", launcherInput.value.trim().length > 0);
  });
  const closeBtn = panel.querySelector(".chat-close");
  const log = panel.querySelector(".chat-log");
  const suggestionsWrap = panel.querySelector(".chat-suggestions");
  const composer = panel.querySelector(".chat-composer");
  const composerInput = composer.querySelector("input");

  let isStreaming = false;

  // Suggested question chips
  SUGGESTIONS.forEach((s) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chat-chip";
    chip.textContent = s;
    chip.addEventListener("click", () => {
      suggestionsWrap.style.display = "none";
      submit(s);
    });
    suggestionsWrap.appendChild(chip);
  });

  function openPanel() {
    panel.classList.add("is-open");
    launcher.classList.add("is-hidden");
    setTimeout(() => composerInput.focus(), 120);
  }

  function closePanel() {
    panel.classList.remove("is-open");
    launcher.classList.remove("is-hidden");
  }

  function scrollLog() {
    log.scrollTop = log.scrollHeight;
  }

  function addUser(text) {
    const el = document.createElement("div");
    el.className = "chat-msg user";
    el.textContent = text;
    log.appendChild(el);
    scrollLog();
  }

  function showTyping() {
    const t = document.createElement("div");
    t.className = "chat-typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(t);
    scrollLog();
    return t;
  }

  // Simulated word-by-word streaming
  function streamInto(fullText) {
    return new Promise((resolve) => {
      const el = document.createElement("div");
      el.className = "chat-msg bot";
      log.appendChild(el);
      const words = fullText.split(" ");
      let i = 0;
      const tick = () => {
        i++;
        el.innerHTML = render(words.slice(0, i).join(" "));
        scrollLog();
        if (i < words.length) {
          setTimeout(tick, 22 + Math.random() * 45);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  async function submit(text) {
    const message = text.trim();
    if (!message || isStreaming) return;
    if (!panel.classList.contains("is-open")) openPanel();
    suggestionsWrap.style.display = "none";

    addUser(message);
    isStreaming = true;

    const typing = showTyping();
    // Simulate network + thinking latency
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 500));
    typing.remove();

    const answer = generateResponse(message);
    await streamInto(answer);
    isStreaming = false;
    composerInput.focus();
  }

  // Events
  launcherForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = launcherInput.value;
    launcherInput.value = "";
    launcherForm.classList.remove("has-text");
    submit(v);
  });

  composer.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = composerInput.value;
    composerInput.value = "";
    submit(v);
  });

  closeBtn.addEventListener("click", closePanel);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel();
  });
})();
