'use client';

import { useEffect } from "react";
import { Html5QrcodeScanner} from "html5-qrcode";

export default function ScanQrPage() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 10,
    });
    scanner.render(
        (decodedText,decodeResult) => {
            console.log('Code Scanned:', decodedText);

            window.location.href = `/answer?target=${encodeURIComponent(decodedText)}`;

        },
        (error) => {
            console.warn('Scanning error:', error);
        }
    );

    return () => scanner.clear();
}, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Scan QR Code</h1>
            <div id="reader" style={{ width: "100%" }}></div>
        </div>
    );
}