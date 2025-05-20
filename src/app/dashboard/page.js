'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DashboardPage() {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);

    useEffect(() => {
        async function fetchScore() {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.push('/sign-in');
                return;
            }

            const currentUserId = user.id;

            // 🔄 NEW: Fetch total score from `scores` table
            const { data, error } = await supabase
                .from('scores')
                .select('score')
                .eq('user_id', currentUserId);

            if (error) {
                console.error('Error fetching score:', error);
                return;
            }

            const totalScore = data.reduce((sum, row) => sum + (row.score || 0), 0);

            setScore(totalScore);
            setLoading(false);
        }

        fetchScore();
    }, [router, supabase]);

    if (loading) return <p className="p-6">Loading...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p className="text-lg">
                You earned a total of <strong>{score}</strong> point{score !== 1 ? 's' : ''} for answering questions correctly.
            </p>
        </div>
    );
}
