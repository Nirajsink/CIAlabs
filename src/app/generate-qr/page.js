'use client';

import { useEffect,useState } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

export default function GenerateQrPage() {
  const [userId, setUserId] = useState(null);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    const fetchUserAndGenerte = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);
        await generateQR(user.id);
    };

    fetchUserAndGenerte();

    const interval = setInterval(() => {
        if (userId) generateQR(userId);
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const generateQR = async (uid) => {

    const { data: userData, error } = await supabase
      .from('users_data')
      .select('*')
      .eq('user_id', uid)
      .single();

      if (error || !userData) {
        console.error('Error fetching user code:', error);
        return;
      }

        const { data: allQuestions } = await supabase.from('questions').select('*');

        const questionMap = {};
        allQuestions.forEach(q => {
            questionMap[q.key] = q.question_text;
        });

        const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
        const shuffled = keys.sort(() => 0.5 - Math.random()).slice(0, 3);

        const selected = shuffled.map((key) => ({
            key: key,
            question: questionMap[key],
        }));

        const payload = {
            uid: uid,
            ts: Date.now(),
            questions: selected,
        };

        setQrData(JSON.stringify(payload));
      };

      return (
        <div className="p-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Generate QR Code</h1>
            {qrData ? (
                <>
                <QRCodeSVG value={qrData} size={256} />
                <p className="text-sm text-gray-500 mt-2">Changes every 10 seconds</p>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
      );
    }