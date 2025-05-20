'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AnswerPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [userId, setUserId] = useState(null);
  const [targetUserId, setTargetUserId] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/sign-in');
        return;
      }

      setUserId(user.id);

      const target = searchParams.get('target');
      if (!target) {
        router.push('/error');
        return;
      }

      setTargetUserId(target);

      
      const { data: originalAnswers } = await supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', target);

      const questionIds = originalAnswers?.map(a => a.question_id) || [];

      
      const selected = questionIds.sort(() => 0.5 - Math.random()).slice(0, 3);

      const { data: qs, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .in('id', selected);

      if (qErr) {
        console.error("Error loading questions", qErr);
        return;
      }

      setQuestions(qs);
      setLoading(false);
    }

    init();
  }, [router, supabase, searchParams]);

  const handleAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const entries = Object.entries(answers);

    
    const scannedPayload = entries.map(([questionId, answer_text]) => ({
      scanned_by: userId,
      question_id: Number(questionId),
      answer_text,
      target_user_id: targetUserId,
    }));

    await supabase.from('scanned_answers').insert(scannedPayload);

  
    const { data: originalAnswers } = await supabase
      .from('user_answers')
      .select('question_id, selected_option')
      .eq('user_id', targetUserId);

    
    let score = 0;
    entries.forEach(([questionId, answer_text]) => {
      const original = originalAnswers.find(o => o.question_id === Number(questionId));
      if (original && original.selected_option === answer_text) {
        score++;
      }
    });

    await supabase.from('scores').insert({
      user_id: userId,
      target_id: targetUserId,
      score,
    });

    router.push('/thank-you');
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-xl font-bold mb-4">Answer the Questions</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="border p-4 rounded">
            <p className="font-semibold">{q.question_text}</p>
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
