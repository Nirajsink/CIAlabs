'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

export default function GenerateQrPage() {
  const [userId, setUserId] = useState(null);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    let interval;

    const fetchUserAndGenerate = async () => {
      console.log("Fetching user...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Supabase Auth error:", sessionError.message);
        return;
      }

      const user = session?.user;
      if (!user) {
        console.warn("No user found");
        return;
      }

      console.log("User ID:", user.id);
      setUserId(user.id);

      await generateQR(user.id);

      interval = setInterval(() => {
        generateQR(user.id);
      }, 10000);
    };

    fetchUserAndGenerate();

    return () => clearInterval(interval);
  }, []);

  const generateQR = async (uid) => {
    console.log("Generating QR for user:", uid);

    const { data: userData, error: userError } = await supabase
  .from('user_data')
  .select('*')
  .eq('user_id', uid)
  .single();


    if (userError || !userData) {
      console.error("Error fetching user data:", userError);
      return;
    }

    console.log("User data:", userData);

    const { data: allQuestions, error: qError } = await supabase
      .from('questions')
      .select('*');

    if (qError || !allQuestions) {
      console.error("Error fetching questions:", qError);
      return;
    }

    const questionMap = {};
    allQuestions.forEach(q => {
      questionMap[q.key] = q.question_text;
    });

    const keys = Object.keys(questionMap);
    if (keys.length < 3) {
      console.error("Not enough questions in DB.");
      return;
    }

    const shuffled = keys.sort(() => 0.5 - Math.random()).slice(0, 3);
    const selected = shuffled.map((key) => ({
      key,
      question: questionMap[key],
    }));

    const payload = {
      uid: uid,
      ts: Date.now(),
      questions: selected,
    };

    const qrString = JSON.stringify(payload);
    console.log("QR Payload:", qrString);
    setQrData(qrString);
  };

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Generate QR Code</h1>
      <p className="mb-2 text-sm text-gray-600">Page loaded</p>

      {qrData ? (
        <>
          <QRCodeSVG value={qrData} size={256} />
          <p className="text-sm text-gray-500 mt-2">QR regenerates every 10 seconds</p>
        </>
      ) : (
        <p>Loading QR code...</p>
      )}
    </div>
  );
}
