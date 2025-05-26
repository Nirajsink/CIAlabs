'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [userId, setUserId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login"); // if not logged in
        return;
      }

      setUserId(user.id);

      // Check if already answered
      const { data: existing } = await supabase
        .from("user_answers")
        .select("id")
        .eq("user_id", user.id);

      if (existing && existing.length > 0) {
        router.push("/"); // already answered, go home
        return;
      }

      // Load all questions
      const { data: qs, error } = await supabase.from("questions").select("*");
      if (error) {
        console.error("Failed to load questions:", error.message);
        return;
      }

      setQuestions(qs);
      setLoading(false);
    }

    fetchData();
  }, [router, supabase]);

  const handleAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = Object.entries(answers).map(([questionId, selected_option]) => ({
      user_id: userId,
      question_id: Number(questionId),
      selected_option,
    }));

    await supabase.from("user_answers").insert(payload);

    router.push("/");
  };

  if (loading) return <p>Loading questions...</p>;

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-xl font-bold mb-6">Answer These Questions</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="border p-4 rounded">
            <p className="font-medium">{q.question_text}</p>
            <div className="mt-2 space-y-2">
              {q.options.map((option, idx) => (
                <label key={idx} className="block">
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => handleAnswer(q.id, option)}
                    required
                  />{" "}
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Answers
        </button>
      </form>
    </div>
  );
}
