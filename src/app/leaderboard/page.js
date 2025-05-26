'use client';

import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LeaderboardPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      // Step 1: Fetch scores and group by user_id
      const { data, error } = await supabase
        .from('scores')
        .select('user_id, score');

      if (error) {
        console.error('Error fetching scores:', error);
        return;
      }

      // Step 2: Group by user_id and calculate total score per user
      const userScores = {};
      data.forEach(({ user_id, score }) => {
        if (!userScores[user_id]) {
          userScores[user_id] = 0;
        }
        userScores[user_id] += score;
      });

      // Step 3: Convert to array & sort by score descending
      const sorted = Object.entries(userScores)
        .map(([userId, total]) => ({ userId, total }))
        .sort((a, b) => b.total - a.total);

      // Step 4: Optional - get user emails (or usernames)
      const leaderboardWithNames = await Promise.all(
        sorted.map(async ({ userId, total }) => {
         const { data: userData } = await supabase
            .from('user_data')
            .select('full_name')
            .eq('user_id', userId)
            .single();

          return {
            userId,
            username: userData?.username || userId.slice(0, 6),
            total,
          };
        })
      );

      setLeaderboard(leaderboardWithNames);
      setLoading(false);
    }

    fetchLeaderboard();
  }, [supabase]);

  if (loading) return <p className="p-6">Loading leaderboard...</p>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <ul className="space-y-2">
        {leaderboard.map((entry, index) => (
          <li key={entry.userId} className="border p-4 rounded">
            <p>
              <strong>#{index + 1}</strong> – {entry.username}  
            </p>
            <p>Total Score: {entry.total}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
