import { useState, useEffect, useRef } from "react";

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: "#f7f4ef",
  bgWarm: "#ede8df",
  surface: "#ffffff",
  surfaceWarm: "#faf8f4",
  border: "#e2dbd0",
  borderMid: "#c8bfb0",
  text: "#2c2418",
  textMid: "#6b5e4e",
  textLight: "#a0917f",
  green: "#3d7a5a",
  greenSoft: "#eaf3ee",
  greenBorder: "#b8d9c6",
  amber: "#c47c2b",
  amberSoft: "#fef3e2",
  amberBorder: "#f0cc90",
  blue: "#3a6896",
  blueSoft: "#eaf0f8",
  blueBorder: "#b0cce8",
  red: "#c0392b",
  redSoft: "#fdecea",
};

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; font-family: 'Noto Sans KR', sans-serif; color: ${C.text}; }
  
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.45;} }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pop { 0%{transform:scale(0.92);opacity:0;} 100%{transform:scale(1);opacity:1;} }
  @keyframes bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }

  .fade-up { animation: fadeUp 0.45s ease both; }
  .fade-in { animation: fadeIn 0.3s ease both; }
  .pop { animation: pop 0.35s cubic-bezier(.22,1,.36,1) both; }
  .pulse { animation: pulse 1.6s ease infinite; }
  .spin { animation: spin 1s linear infinite; }

  textarea, input { font-family: 'Noto Sans KR', sans-serif; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${C.bgWarm}; }
  ::-webkit-scrollbar-thumb { background: ${C.borderMid}; border-radius: 3px; }

  .nav-btn {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 10px 16px; border: none; background: none; cursor: pointer;
    font-size: 11px; font-family: 'Noto Sans KR', sans-serif;
    color: ${C.textLight}; border-radius: 12px; transition: all 0.2s; flex: 1;
  }
  .nav-btn:hover { background: ${C.bgWarm}; color: ${C.textMid}; }
  .nav-btn.active { color: ${C.green}; background: ${C.greenSoft}; }
  .nav-btn .icon { font-size: 22px; }

  .card {
    background: ${C.surface}; border: 1px solid ${C.border};
    border-radius: 20px; padding: 1.25rem 1.5rem;
  }
  .card-warm {
    background: ${C.surfaceWarm}; border: 1px solid ${C.border};
    border-radius: 20px; padding: 1.25rem 1.5rem;
  }

  .btn-primary {
    background: ${C.green}; color: white; border: none; border-radius: 12px;
    padding: 13px 28px; font-size: 15px; font-weight: 600;
    font-family: 'Noto Sans KR', sans-serif; cursor: pointer;
    transition: all 0.2s; letter-spacing: -0.01em;
  }
  .btn-primary:hover { background: #2f6347; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  .btn-secondary {
    background: ${C.surface}; color: ${C.textMid}; border: 1px solid ${C.border};
    border-radius: 12px; padding: 11px 22px; font-size: 14px; font-weight: 500;
    font-family: 'Noto Sans KR', sans-serif; cursor: pointer; transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: ${C.borderMid}; background: ${C.bgWarm}; }

  .textarea-main {
    width: 100%; background: ${C.bgWarm}; border: 1px solid ${C.border};
    border-radius: 14px; padding: 14px 16px; font-size: 15px; line-height: 1.8;
    color: ${C.text}; outline: none; resize: none; transition: border-color 0.2s;
    font-family: 'Noto Serif KR', serif;
  }
  .textarea-main:focus { border-color: ${C.green}; box-shadow: 0 0 0 3px ${C.greenSoft}; }
  .textarea-main::placeholder { color: ${C.textLight}; font-family: 'Noto Sans KR', sans-serif; }

  .chat-bubble-ai {
    background: ${C.surface}; border: 1px solid ${C.border};
    border-radius: 18px 18px 18px 4px; padding: 12px 16px;
    font-size: 15px; line-height: 1.75; color: ${C.text};
    max-width: 88%; animation: fadeUp 0.3s ease both;
  }
  .chat-bubble-user {
    background: ${C.green}; color: white;
    border-radius: 18px 18px 4px 18px; padding: 12px 16px;
    font-size: 15px; line-height: 1.75; margin-left: auto;
    max-width: 88%; animation: fadeUp 0.3s ease both;
  }
`;

// ── API Call ───────────────────────────────────────────────────────────────────
async function callClaude(messages, system = "") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
}

// ── Home Screen ────────────────────────────────────────────────────────────────
function HomeScreen({ onNav, diary, quizScore }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "좋은 아침이에요 ☀️" : hour < 18 ? "안녕하세요 🌿" : "좋은 저녁이에요 🌙";
  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: "0.25rem" }}>
        <p style={{ fontSize: 13, color: C.textLight, fontWeight: 500 }}>{today}</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Noto Serif KR', serif", letterSpacing: "-0.02em", lineHeight: 1.35, marginTop: 4 }}>{greeting}</h1>
        <p style={{ fontSize: 14, color: C.textMid, marginTop: 6, lineHeight: 1.6 }}>오늘도 두뇌를 건강하게 가꿔볼까요?</p>
      </div>

      {/* Daily tip */}
      <div className="fade-up card-warm" style={{ animationDelay: "0.05s", borderLeft: `3px solid ${C.green}`, borderRadius: "0 16px 16px 0", paddingLeft: "1rem" }}>
        <p style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 4, letterSpacing: "0.04em" }}>💡 오늘의 두뇌 건강 팁</p>
        <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65 }}>새로운 것을 배우는 활동은 뇌의 신경 연결을 강화합니다. 매일 10분씩 꾸준히 훈련해보세요!</p>
      </div>

      {/* Menu cards */}
      <div className="fade-up" style={{ animationDelay: "0.1s", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={() => onNav("quiz")} style={{ background: C.greenSoft, border: `1px solid ${C.greenBorder}`, borderRadius: 18, padding: "1.25rem", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🧩</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.green }}>두뇌 퀴즈</p>
          <p style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>AI와 함께 두뇌 훈련</p>
          {quizScore > 0 && <p style={{ fontSize: 11, color: C.green, marginTop: 6, fontWeight: 600 }}>최근 {quizScore}점 획득 🎉</p>}
        </button>

        <button onClick={() => onNav("diary")} style={{ background: C.amberSoft, border: `1px solid ${C.amberBorder}`, borderRadius: 18, padding: "1.25rem", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.amber }}>회상 일기</p>
          <p style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>기억을 글로 기록하기</p>
          {diary.length > 0 && <p style={{ fontSize: 11, color: C.amber, marginTop: 6, fontWeight: 600 }}>총 {diary.length}개 기록됨 ✍️</p>}
        </button>

        <button onClick={() => onNav("chat")} style={{ background: C.blueSoft, border: `1px solid ${C.blueBorder}`, borderRadius: 18, padding: "1.25rem", textAlign: "left", cursor: "pointer", transition: "all 0.2s", gridColumn: "1 / -1" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 36 }}>🤖</div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>AI 두뇌 트레이너와 대화</p>
              <p style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>기억력, 집중력, 언어 능력을 자유롭게 훈련해요</p>
            </div>
          </div>
        </button>
      </div>

      {/* Streak info */}
      <div className="fade-up card" style={{ animationDelay: "0.15s", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ fontSize: 36 }}>🔥</div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>꾸준히 훈련 중!</p>
          <p style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>매일 조금씩 하는 훈련이 가장 효과적입니다.</p>
        </div>
      </div>
    </div>
  );
}

// ── Quiz Screen ────────────────────────────────────────────────────────────────
const QUIZ_CATEGORIES = [
  { id: "memory", label: "기억력", emoji: "🧠", desc: "단어·숫자 기억 훈련" },
  { id: "language", label: "언어 능력", emoji: "📝", desc: "어휘·표현력 향상" },
  { id: "logic", label: "논리·추론", emoji: "🔍", desc: "패턴·문제 해결" },
  { id: "knowledge", label: "상식 퀴즈", emoji: "🌍", desc: "역사·문화·과학 상식" },
];

function QuizScreen({ onScoreUpdate }) {
  const [phase, setPhase] = useState("select"); // select | playing | result
  const [category, setCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [qCount, setQCount] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startQuiz(cat) {
    setCategory(cat);
    setPhase("playing");
    setMessages([]);
    setScore(0);
    setQCount(0);
    setLoading(true);
    const sys = getSystem(cat.id);
    const first = await callClaude([{ role: "user", content: "시작해줘" }], sys);
    setMessages([{ role: "assistant", content: first }]);
    setQCount(1);
    setLoading(false);
  }

  function getSystem(catId) {
    const base = `당신은 40~50대를 위한 친근한 두뇌 트레이너입니다. 한국어로만 대화하세요.
규칙:
- 한 번에 하나의 질문만 제시
- 정답/오답 여부를 즉시 알려주고 간단한 설명 추가
- 격려하는 말투 사용 ("잘하셨어요!", "아쉽네요, 정답은...")
- 답변 끝에 항상 "[점수:X]" 형태로 누적 점수 표시 (맞으면 +10, 틀리면 +0)
- 5문제 후 "훈련 완료!" 라고 말하고 총점 및 간단한 피드백 제공`;

    const specific = {
      memory: "기억력 훈련: 단어 목록 기억하기, 숫자 순서 기억, 이미지 연상 등으로 단기 기억력을 훈련하세요.",
      language: "언어 능력 훈련: 속담 완성하기, 반대말/유의어, 문장 빈칸 채우기 등 어휘력을 키우세요.",
      logic: "논리 추론 훈련: 숫자 패턴, 논리 퍼즐, 간단한 수학 문제로 추론 능력을 키우세요.",
      knowledge: "상식 퀴즈: 한국 역사, 문화, 과학 상식 등 다양한 분야의 상식을 테스트하세요.",
    };
    return base + "\n\n" + (specific[catId] || "");
  }

  async function sendAnswer() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const reply = await callClaude(
      newMessages.map(m => ({ role: m.role, content: m.content })),
      getSystem(category.id)
    );

    // parse score
    const scoreMatch = reply.match(/\[점수:(\d+)\]/);
    if (scoreMatch) setScore(parseInt(scoreMatch[1]));

    const isEnd = reply.includes("훈련 완료");
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    if (!isEnd) setQCount(c => c + 1);
    else { setPhase("result"); onScoreUpdate(scoreMatch ? parseInt(scoreMatch[1]) : score); }
    setLoading(false);
  }

  if (phase === "select") return (
    <div style={{ padding: "1.5rem" }}>
      <div className="fade-up" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Noto Serif KR', serif" }}>🧩 두뇌 퀴즈</h2>
        <p style={{ fontSize: 14, color: C.textMid, marginTop: 6 }}>훈련할 영역을 선택해주세요</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {QUIZ_CATEGORIES.map((cat, i) => (
          <button key={cat.id} className="fade-up card" style={{ animationDelay: `${i * 0.07}s`, textAlign: "left", cursor: "pointer", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = C.greenSoft; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
            onClick={() => startQuiz(cat)}>
            <div style={{ fontSize: 36, flexShrink: 0 }}>{cat.emoji}</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>{cat.label}</p>
              <p style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>{cat.desc}</p>
            </div>
            <div style={{ marginLeft: "auto", color: C.textLight, fontSize: 18 }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );

  if (phase === "result") return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1.25rem" }}>
      <div className="pop" style={{ fontSize: 72 }}>🎉</div>
      <div className="fade-up">
        <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Noto Serif KR', serif" }}>훈련 완료!</h2>
        <p style={{ fontSize: 15, color: C.textMid, marginTop: 8 }}>{category?.label} 훈련을 마쳤어요</p>
      </div>
      <div className="fade-up card" style={{ width: "100%", animationDelay: "0.1s" }}>
        <p style={{ fontSize: 40, fontWeight: 700, color: C.green }}>{score}점</p>
        <p style={{ fontSize: 14, color: C.textMid, marginTop: 4 }}>5문제 × 10점 = 최대 50점</p>
      </div>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPhase("select")}>다른 훈련 하기</button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => startQuiz(category)}>다시 도전 🔄</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{category?.emoji}</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{category?.label}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.green, fontWeight: 600, background: C.greenSoft, padding: "3px 10px", borderRadius: 20 }}>{score}점</span>
          <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setPhase("select")}>나가기</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12, background: C.bgWarm }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && <span style={{ fontSize: 24, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>🤖</span>}
            <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
              style={{ whiteSpace: "pre-wrap" }}>
              {m.content.replace(/\[점수:\d+\]/g, "").trim()}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div className="chat-bubble-ai pulse" style={{ color: C.textLight }}>생각 중...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${C.border}`, background: C.surface, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAnswer()}
          placeholder="답변을 입력하세요..." disabled={loading}
          style={{ flex: 1, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "'Noto Sans KR', sans-serif" }} />
        <button className="btn-primary" onClick={sendAnswer} disabled={loading || !input.trim()} style={{ padding: "11px 18px", borderRadius: 12 }}>
          {loading ? <span className="spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }} /> : "전송"}
        </button>
      </div>
    </div>
  );
}

// ── Diary Screen ───────────────────────────────────────────────────────────────
const DIARY_PROMPTS = [
  "오늘 가장 즐거웠던 순간은 무엇인가요?",
  "최근에 맛있게 먹은 음식이 있나요? 어디서 누구와 먹었나요?",
  "어린 시절 가장 행복했던 기억을 떠올려보세요.",
  "최근에 고마웠던 사람이 있나요?",
  "요즘 즐기는 취미나 활동이 있나요?",
  "오늘 날씨는 어떤가요? 날씨를 보며 어떤 생각이 드나요?",
];

function DiaryScreen({ diary, onSave }) {
  const [phase, setPhase] = useState("list"); // list | write | view
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aiComment, setAiComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);

  function startWrite() {
    const p = DIARY_PROMPTS[Math.floor(Math.random() * DIARY_PROMPTS.length)];
    setPrompt(p);
    setText("");
    setAiComment("");
    setPhase("write");
  }

  async function saveEntry() {
    if (!text.trim()) return;
    setLoading(true);
    const comment = await callClaude(
      [{ role: "user", content: `다음은 치매 예방을 위해 회상 일기를 쓰는 사람의 글입니다. 따뜻하고 공감적인 피드백을 2~3문장으로 써주세요. 기억을 더 자세히 떠올릴 수 있는 질문도 한 가지 포함해주세요.\n\n"${text}"` }],
      "당신은 따뜻하고 공감적인 기억 코치입니다. 한국어로 답변하세요."
    );
    setAiComment(comment);
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
      prompt,
      text,
      aiComment: comment,
    };
    onSave(entry);
    setLoading(false);
    setPhase("saved");
  }

  if (phase === "view" && viewEntry) return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setPhase("list")}>← 목록</button>
        <p style={{ fontSize: 13, color: C.textLight }}>{viewEntry.date}</p>
      </div>
      <div className="card-warm" style={{ borderLeft: `3px solid ${C.amber}`, borderRadius: "0 16px 16px 0", paddingLeft: "1rem" }}>
        <p style={{ fontSize: 13, color: C.amber, fontWeight: 600, marginBottom: 4 }}>📌 오늘의 주제</p>
        <p style={{ fontSize: 14, color: C.textMid }}>{viewEntry.prompt}</p>
      </div>
      <div className="card">
        <p style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 15, lineHeight: 1.9, color: C.text, whiteSpace: "pre-wrap" }}>{viewEntry.text}</p>
      </div>
      {viewEntry.aiComment && (
        <div className="card" style={{ background: C.greenSoft, borderColor: C.greenBorder }}>
          <p style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 6 }}>🤖 AI 피드백</p>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75 }}>{viewEntry.aiComment}</p>
        </div>
      )}
    </div>
  );

  if (phase === "saved") return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="pop" style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✍️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Noto Serif KR', serif" }}>기록 완료!</h2>
        <p style={{ fontSize: 14, color: C.textMid, marginTop: 6 }}>오늘의 기억을 소중하게 담았어요.</p>
      </div>
      {aiComment && (
        <div className="card fade-up" style={{ background: C.greenSoft, borderColor: C.greenBorder }}>
          <p style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 8 }}>🤖 AI 코치의 말</p>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: C.text }}>{aiComment}</p>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPhase("list")}>목록 보기</button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={startWrite}>또 쓰기 ✍️</button>
      </div>
    </div>
  );

  if (phase === "write") return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setPhase("list")}>← 뒤로</button>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>📖 회상 일기</h2>
      </div>
      <div className="card-warm fade-up" style={{ borderLeft: `3px solid ${C.amber}`, borderRadius: "0 16px 16px 0", paddingLeft: "1rem" }}>
        <p style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 4 }}>📌 오늘의 주제</p>
        <p style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>{prompt}</p>
      </div>
      <textarea className="textarea-main fade-up" rows={10} placeholder="기억나는 것을 자유롭게 적어보세요. 작은 것도 좋아요 ✨" value={text} onChange={e => setText(e.target.value)} style={{ animationDelay: "0.1s" }} />
      <p style={{ fontSize: 12, color: C.textLight, textAlign: "right" }}>{text.length}자</p>
      <button className="btn-primary fade-up" style={{ animationDelay: "0.15s" }} onClick={saveEntry} disabled={loading || text.trim().length < 5}>
        {loading ? "AI가 피드백 작성 중..." : "기록하고 AI 피드백 받기 →"}
      </button>
    </div>
  );

  return (
    <div style={{ padding: "1.5rem" }}>
      <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Noto Serif KR', serif" }}>📖 회상 일기</h2>
          <p style={{ fontSize: 13, color: C.textMid, marginTop: 4 }}>기억을 글로 쓰면 뇌가 활성화됩니다</p>
        </div>
        <button className="btn-primary" onClick={startWrite} style={{ padding: "10px 18px", fontSize: 14 }}>+ 새 기록</button>
      </div>

      {diary.length === 0 ? (
        <div className="fade-up card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>첫 번째 기억을 기록해보세요</p>
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65 }}>매일 조금씩 기억을 되살리는 것이<br />두뇌 건강에 큰 도움이 됩니다.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...diary].reverse().map((entry, i) => (
            <button key={entry.id} className="fade-up card" style={{ animationDelay: `${i * 0.06}s`, textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.amber; e.currentTarget.style.background = C.amberSoft; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
              onClick={() => { setViewEntry(entry); setPhase("view"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <p style={{ fontSize: 12, color: C.textLight }}>{entry.date}</p>
                <span style={{ fontSize: 11, color: C.amber, background: C.amberSoft, padding: "2px 8px", borderRadius: 10, border: `1px solid ${C.amberBorder}` }}>회상</span>
              </div>
              <p style={{ fontSize: 14, color: C.textMid, marginBottom: 6, fontWeight: 500 }}>{entry.prompt}</p>
              <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{entry.text}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chat Screen ────────────────────────────────────────────────────────────────
function ChatScreen() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "안녕하세요! 저는 두뇌 트레이너 AI예요 🧠\n\n기억력, 집중력, 언어 능력 훈련을 도와드립니다. 어떤 것이 궁금하거나 훈련하고 싶으세요?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const SYSTEM = `당신은 40~50대를 위한 친근하고 따뜻한 두뇌 건강 트레이너입니다.
역할:
- 치매 예방을 위한 두뇌 훈련 (기억력, 집중력, 언어력, 논리력)
- 건강한 생활 습관 조언 (수면, 운동, 식단)
- 두뇌 건강 정보 제공
- 격려와 공감으로 꾸준한 훈련 동기 부여

말투: 따뜻하고 친근하게, 존댓말 사용. 너무 의학적/딱딱하지 않게.
한국어로만 대화하세요.`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setLoading(true);
    const reply = await callClaude(newMsgs.map(m => ({ role: m.role, content: m.content })), SYSTEM);
    setMessages([...newMsgs, { role: "assistant", content: reply }]);
    setLoading(false);
  }

  const quickTips = ["기억력 훈련 방법 알려줘", "오늘 퀴즈 내줘", "치매 예방 식품은?", "집중력 키우는 방법"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.blueSoft, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>두뇌 트레이너 AI</p>
          <p style={{ fontSize: 11, color: C.green }}>● 온라인</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12, background: C.bgWarm }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            {m.role === "assistant" && <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, alignSelf: "flex-end" }}>🤖</div>}
            <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"} style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <div className="chat-bubble-ai pulse" style={{ color: C.textLight }}>답변 작성 중...</div>
          </div>
        )}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {quickTips.map(tip => (
              <button key={tip} className="btn-secondary" style={{ fontSize: 13, padding: "7px 14px", borderRadius: 20 }} onClick={() => { setInput(tip); }}>
                {tip}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${C.border}`, background: C.surface, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="메시지를 입력하세요..." disabled={loading}
          style={{ flex: 1, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "'Noto Sans KR', sans-serif" }} />
        <button className="btn-primary" onClick={send} disabled={loading || !input.trim()} style={{ padding: "11px 18px", borderRadius: 12 }}>
          {loading ? <span className="spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }} /> : "전송"}
        </button>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function MindaApp() {
  const [tab, setTab] = useState("home");
  const [diary, setDiary] = useState([]);
  const [quizScore, setQuizScore] = useState(0);

  function saveDiary(entry) {
    setDiary(d => [...d, entry]);
  }

  const navItems = [
    { id: "home", label: "홈", icon: "🏠" },
    { id: "quiz", label: "두뇌퀴즈", icon: "🧩" },
    { id: "chat", label: "AI대화", icon: "🤖" },
    { id: "diary", label: "회상일기", icon: "📖" },
  ];

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Top bar */}
        <div style={{ padding: "1rem 1.5rem 0.75rem", background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</div>
            <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Noto Serif KR', serif", letterSpacing: "-0.01em" }}>마인다</span>
          </div>
          <span style={{ fontSize: 12, color: C.textLight, background: C.greenSoft, padding: "3px 10px", borderRadius: 20, border: `1px solid ${C.greenBorder}`, fontWeight: 500 }}>두뇌 건강 앱</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "home" && <HomeScreen onNav={setTab} diary={diary} quizScore={quizScore} />}
          {tab === "quiz" && <QuizScreen onScoreUpdate={setQuizScore} />}
          {tab === "chat" && <ChatScreen />}
          {tab === "diary" && <DiaryScreen diary={diary} onSave={saveDiary} />}
        </div>

        {/* Bottom nav */}
        <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.surface, padding: "6px 8px", position: "sticky", bottom: 0 }}>
          {navItems.map(item => (
            <button key={item.id} className={`nav-btn ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
