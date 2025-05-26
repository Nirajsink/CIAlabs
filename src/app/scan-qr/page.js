'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const QrReader = dynamic(() => import('react-qr-reader'), { ssr: false });

export default function ScanQrPage() {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleScan = async (data) => {
    if (data && scanning) {
      setScanning(false);
      try {
        const payload = JSON.parse(data);
        const { uid, questions } = payload;

        // Store scanned target UID and questions in localStorage (or pass via URL)
        const encodedTarget = encodeURIComponent(uid);

        router.push(`/answer?target=${encodedTarget}`);
      } catch (err) {
        console.error("Invalid QR data", err);
        setError("Invalid QR code");
        setScanning(true);
      }
    }
  };

  const handleError = (err) => {
    console.error("QR Scan Error", err);
    setError("Error accessing camera");
  };

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Scan QR Code</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {scanning && (
        <div className="mx-auto max-w-xs border border-gray-300 rounded-md overflow-hidden">
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
        </div>
      )}
      {!scanning && !error && (
        <p className="text-gray-600 mt-4">Redirecting...</p>
      )}
    </div>
  );
}
