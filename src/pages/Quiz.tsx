import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, CheckCircle2, XCircle, RotateCcw, Trophy, ArrowRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { QUIZ } from "../lib/data/quiz";

export default function Quiz() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZ[idx];

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= QUIZ.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  const pct = Math.round((score / QUIZ.length) * 100);
  const rating =
    pct >= 90 ? { label: "Threat Hunter", color: "#7fbf9f" }
    : pct >= 70 ? { label: "Security Aware", color: "#82c7d4" }
    : pct >= 50 ? { label: "Getting There", color: "#d9a05b" }
    : { label: "Prime Target", color: "#cf6679" };

  return (
    <div>
      <PageHeader
        title="Security Quiz"
        sub="Test your awareness — instant scoring & explanations"
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8296b3] px-2.5 py-1 rounded-full border border-[#8296b333] bg-[#8296b30d]">
            <GraduationCap size={11} /> {QUIZ.length} questions
          </span>
        }
      />

      {done ? (
        <div className="panel panel-glow-cyan p-8 sm:p-10 text-center anim-pop max-w-xl mx-auto">
          <Trophy size={38} className="mx-auto mb-4" style={{ color: rating.color }} />
          <div className="display text-5xl font-bold" style={{ color: rating.color, textShadow: `0 0 24px ${rating.color}55` }}>
            {score}/{QUIZ.length}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#9b97a4] mt-2">
            {pct}% correct
          </div>
          <div
            className="inline-block mt-4 px-4 py-1.5 rounded-full border font-display font-semibold text-[14px]"
            style={{ color: rating.color, borderColor: `${rating.color}44`, background: `${rating.color}0d` }}
          >
            {rating.label}
          </div>
          <p className="text-[12.5px] text-[#b5b1bc] mt-4 max-w-sm mx-auto leading-relaxed">
            {pct >= 70
              ? "Strong instincts. Keep verifying unexpected requests — awareness decays without practice."
              : "Review the Threat Library cards and retake the quiz — attackers count on the gaps you just found."}
          </p>
          <button
            onClick={restart}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#8296b3] text-white display font-bold text-[13px] hover:shadow-[0_0_28px_-6px_#8296b3] transition-all active:scale-95"
          >
            <RotateCcw size={14} /> Retake Quiz
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* progress */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] text-[#9b97a4]">
              Question {idx + 1} / {QUIZ.length}
            </span>
            <span className="font-mono text-[11px] text-[#7fbf9f]">score: {score}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#34323b] overflow-hidden mb-6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8296b3] to-[#82c7d4] transition-all duration-500"
              style={{ width: `${((idx + (selected !== null ? 1 : 0)) / QUIZ.length) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="panel p-5 sm:p-7"
            >
              <h2 className="display text-[16px] sm:text-[18px] font-semibold text-white leading-relaxed mb-5">
                {q.q}
              </h2>
              <div className="space-y-2.5">
                {q.options.map((opt, i) => {
                  const isAnswer = i === q.answer;
                  const isPicked = i === selected;
                  let cls = "border-[#34323b] bg-[#232228] hover:border-[#3f3d47] hover:bg-[#28272e]";
                  if (selected !== null) {
                    if (isAnswer) cls = "border-[#7fbf9f66] bg-[#7fbf9f0d]";
                    else if (isPicked) cls = "border-[#cf667966] bg-[#cf66790d]";
                    else cls = "border-[#34323b] bg-[#232228] opacity-50";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      disabled={selected !== null}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${cls}`}
                    >
                      <span className="mono text-[11px] text-[#6f6c7a] shrink-0">{String.fromCharCode(65 + i)}</span>
                      <span className="text-[13px] text-[#e9e7ec] flex-1">{opt}</span>
                      {selected !== null && isAnswer && <CheckCircle2 size={17} className="text-[#7fbf9f] shrink-0" />}
                      {selected !== null && isPicked && !isAnswer && <XCircle size={17} className="text-[#cf6679] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className="mt-5 anim-reveal">
                  <div
                    className={`p-4 rounded-xl border text-[12.5px] leading-relaxed ${
                      selected === q.answer
                        ? "border-[#7fbf9f33] bg-[#7fbf9f08] text-[#abd4c0]"
                        : "border-[#d9a05b33] bg-[#d9a05b08] text-[#ddc09a]"
                    }`}
                  >
                    <span className="font-semibold">
                      {selected === q.answer ? "Correct. " : "Not quite. "}
                    </span>
                    {q.explanation}
                  </div>
                  <button
                    onClick={next}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#82c7d4] text-[#1b1a1f] display font-bold text-[13px] hover:shadow-[0_0_28px_-6px_#82c7d4] transition-all active:scale-95"
                  >
                    {idx + 1 >= QUIZ.length ? "See Results" : "Next Question"} <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
