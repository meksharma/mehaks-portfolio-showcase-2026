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
      keys: ["who is mehak", "about mehak", "introduce mehak", "background"],
      answer:
        "Mehak Sharma is a Senior Product Designer with 10+ years of experience across consumer apps, B2B platforms, and AI products. She is based in Shanghai and currently designs AI and Copilot experiences for Outlook Mobile at Microsoft. She is known for thinking in systems, owning work end to end, and building working prototypes to prove a design vision.",
    },
    {
      keys: ["microsoft", "outlook", "summarize", "copilot", "reading pane", "file previewer"],
      answer:
        "At Microsoft, Mehak started on Teams Mobile in April 2022, focusing on search functionality and behavior. She later moved to Outlook, where she leads **Copilot Summarize** and also works on the reading pane, file previewer, and other core experiences. Summarize has reached more than 2.3 million users on iOS.",
    },
    {
      keys: ["ai design", "ai ux", "approach ai", "designing ai", "prompt engineering", "experiments"],
      answer:
        "Mehak approaches AI design from first principles: define the interaction model, test assumptions, and make the behavior tangible before polishing the UI. On Copilot Summarize, she also contributes to prompt engineering, runs experiments, and tracks daily usage to improve output quality. She treats the model behavior and the interface as one product experience.",
    },
    {
      keys: ["vibe coding", "vibe", "prototype", "prototyping", "working prototype", "build it"],
      answer:
        "For Mehak, vibe coding is an integral design tool: a way to turn a direction into something stakeholders can actually use. For the next evolution of Summarize, she built a working prototype connected to real M365 data. That made the vision concrete and helped the team evaluate an AI experience more effectively than static mockups or a presentation deck could.",
    },
    {
      keys: ["design process", "how does mehak work", "how she works", "approach", "process", "philosophy"],
      answer:
        "Three principles define Mehak's process:\n\n**Think in systems, not screens** — challenge assumptions and make sure the team is solving the right problem.\n\n**Accountability doesn't end at handoff** — stay close through engineering, launch, measurement, and iteration.\n\n**Make the vision tangible** — build working prototypes to align teams and prove that a direction works.",
    },
    {
      keys: ["career", "timeline", "experience", "previously", "companies", "work history"],
      answer:
        "Mehak's career spans four product environments: **Samsung** in Bangalore (2015–2016), where she worked on the first My Galaxy app; **SAP** (2016–2019), designing B2B products across data privacy, project management, and warehouse management; **Agoda** (2019–2022), working on loyalty and its property platform; and **Microsoft** (2022–present), designing Teams Mobile and Outlook AI experiences.",
    },
    {
      keys: ["agoda", "booking", "loyalty", "property", "properties", "hotel"],
      answer:
        "At Agoda, Mehak worked across two major areas from July 2019 to April 2022. She designed loyalty and growth experiences that helped travelers understand and engage with rewards, and a 360-degree B2B platform for properties covering onboarding, settings, rates, and how those choices appeared in the consumer app.",
    },
    {
      keys: ["sap", "enterprise", "data privacy", "warehouse", "project management", "germany"],
      answer:
        "At SAP, Mehak was a UX Experience Design Specialist working across data privacy, project management, and warehouse management. She partnered directly with the German team and spent time in Germany conducting user research to identify product gaps.",
    },
    {
      keys: ["samsung", "my galaxy", "bangalore"],
      answer:
        "Mehak began her product design career at Samsung in Bangalore, where she worked on the first version of My Galaxy from 2015 to 2016. It was an all-in-one app connecting Samsung device owners with entertainment, offers, and services.",
    },
    {
      keys: ["skill", "specialise", "specialize", "strength", "tools", "figma", "cursor"],
      answer:
        "Mehak specialises in AI/UX design, vibe coding, prompt engineering, research methods, design experimentation, mobile-first design, and both B2B and consumer products. She also has extensive experience aligning cross-cultural teams across Germany, China, and the US. Her toolkit includes Figma, Cursor, and a range of M365 and AI tools.",
    },
    {
      keys: ["surprising", "personal", "outside work", "hobby", "diving", "diver", "pets", "dogs", "yuzu", "mochi"],
      answer:
        "Something surprising: Mehak is a PADI-certified advanced diver. She also has two dogs, Yuzu, an Australian Shepherd, and Mochi, a Shiba Inu. Outside work, she enjoys morning walks, swimming, diving, and traveling across Southeast Asia.",
    },
    {
      keys: ["location", "where", "based", "shanghai", "china", "relocation"],
      answer:
        "Mehak is currently based in Shanghai, China. She has lived and worked across Bangalore, Thailand, and China, and she is open to relocating for the right design leadership opportunity.",
    },
    {
      keys: ["contact", "hire", "email", "reach", "linkedin", "available", "opportunit", "new role", "leadership role"],
      answer:
        "Mehak is open to design leadership roles globally, including opportunities that involve relocation. Interested in starting a conversation? Reach her at **meksharma@gmail.com** or through LinkedIn at **linkedin.com/in/meksharma**.",
    },
  ];

  const FALLBACK =
    "I'm pretty focused — I know Mehak's work inside out, but not much else. Try asking me about her projects, her design process, or what it's like working on AI at Microsoft.";

  const SUGGESTIONS = [
    "What has Mehak worked on at Microsoft?",
    "How does Mehak approach AI design?",
    "What is vibe coding and how does Mehak use it?",
    "What's Mehak's design process?",
    "Is Mehak open to new opportunities?",
    "Tell me something surprising about Mehak",
  ];

  const FOLLOW_UP_ROUNDS = [
    [
      "How does Mehak approach AI design?",
      "What is vibe coding and how does Mehak use it?",
      "What's Mehak's design process?",
    ],
    [
      "What did Mehak work on before Microsoft?",
      "What are Mehak's strongest skills?",
      "Tell me about Mehak's work at Agoda",
    ],
    [
      "Tell me something surprising about Mehak",
      "Is Mehak open to new opportunities?",
      "Where is Mehak based?",
    ],
    [
      "What has Mehak worked on at Microsoft?",
      "How did Mehak design Copilot Summarize?",
      "How can I contact Mehak?",
    ],
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
      <button class="chat-launcher-spark" type="button" aria-label="Open chat input" aria-expanded="false" aria-controls="chat-launcher-input">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.5l1.6 4.9a5 5 0 0 0 3 3L21.5 12l-4.9 1.6a5 5 0 0 0-3 3L12 21.5l-1.6-4.9a5 5 0 0 0-3-3L2.5 12l4.9-1.6a5 5 0 0 0 3-3L12 2.5z"/>
        </svg>
      </button>
      <input class="chat-launcher-input" id="chat-launcher-input" type="text" placeholder="Ask me something…" aria-label="Ask the assistant" />
      <button class="chat-send chat-launcher-send" type="submit" aria-label="Send">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>
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
        <p class="chat-panel-sub">Portfolio assistant</p>
      </div>
      <button class="chat-close" aria-label="Close chat">×</button>
    </div>
    <div class="chat-log" aria-live="polite">
      <p class="chat-welcome">Hi! I know <strong>Mehak's</strong> work, design process, and career. What would you like to know?</p>
    </div>
    <div class="chat-suggestions"></div>
    <form class="chat-composer" autocomplete="off">
      <input type="text" placeholder="Ask me something…" aria-label="Type your message" />
      <button class="chat-send" type="submit" aria-label="Send">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>
    </form>`;
  document.body.appendChild(panel);

  const launcherForm = launcher.querySelector(".chat-launcher-form");
  const launcherSpark = launcher.querySelector(".chat-launcher-spark");
  const launcherInput = launcher.querySelector(".chat-launcher-input");
  const mobileLauncherQuery = window.matchMedia("(max-width: 760px)");

  const setLauncherExpanded = (expanded) => {
    if (!mobileLauncherQuery.matches) return;
    launcher.classList.toggle("is-expanded", expanded);
    launcherSpark.setAttribute("aria-expanded", String(expanded));
    launcherSpark.setAttribute("aria-label", expanded ? "Collapse chat input" : "Open chat input");
    if (expanded) setTimeout(() => launcherInput.focus(), 180);
  };

  launcherSpark.addEventListener("click", () => {
    if (mobileLauncherQuery.matches) {
      setLauncherExpanded(!launcher.classList.contains("is-expanded"));
    } else {
      launcherInput.focus();
    }
  });

  launcherInput.addEventListener("input", () => {
    launcherForm.classList.toggle("has-text", launcherInput.value.trim().length > 0);
  });
  const closeBtn = panel.querySelector(".chat-close");
  const log = panel.querySelector(".chat-log");
  const suggestionsWrap = panel.querySelector(".chat-suggestions");
  const composer = panel.querySelector(".chat-composer");
  const composerInput = composer.querySelector("input");

  let isStreaming = false;
  let suggestionRound = 0;

  function renderSuggestions(suggestions) {
    suggestionsWrap.replaceChildren();
    suggestions.forEach((suggestion) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chat-chip";
      chip.textContent = suggestion;
      chip.addEventListener("click", () => {
        suggestionsWrap.style.display = "none";
        submit(suggestion);
      });
      suggestionsWrap.appendChild(chip);
    });
    suggestionsWrap.style.display = "flex";
  }

  function showNextSuggestions() {
    renderSuggestions(FOLLOW_UP_ROUNDS[suggestionRound % FOLLOW_UP_ROUNDS.length]);
    suggestionRound++;
  }

  renderSuggestions(SUGGESTIONS);

  function openPanel() {
    panel.classList.add("is-open");
    setLauncherExpanded(false);
    launcher.classList.add("is-hidden");
    setTimeout(() => composerInput.focus(), 120);
  }

  function closePanel() {
    panel.classList.remove("is-open");
    setLauncherExpanded(false);
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
    showNextSuggestions();
    scrollLog();
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
    if (e.key !== "Escape") return;
    if (panel.classList.contains("is-open")) {
      closePanel();
    } else if (launcher.classList.contains("is-expanded")) {
      setLauncherExpanded(false);
      launcherSpark.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (launcher.classList.contains("is-expanded") && !launcher.contains(e.target)) {
      setLauncherExpanded(false);
    }
  });

  mobileLauncherQuery.addEventListener("change", (e) => {
    if (!e.matches) {
      launcher.classList.remove("is-expanded");
      launcherSpark.setAttribute("aria-expanded", "false");
      launcherSpark.setAttribute("aria-label", "Open chat input");
    }
  });
})();
