import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import useStore from '../../store/useStore';

const QRScanner = ({ onScanSuccess, onScanError, onClose }) => {
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useStore();

  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner;

    const startScanner = async () => {
      try {
        html5QrcodeScanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          false
        );

        html5QrcodeScanner.render(handleScanSuccess, handleScanError);
        setScanner(html5QrcodeScanner);
      } catch (err) {
        console.error('Error initializing QR scanner:', err);
        setError('Camera initialization failed.');
      }
    };

    startScanner();

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch((err) => {
          console.error('Error clearing scanner on unmount:', err);
        });
      }
    };
  }, []);

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log('Scan success:', decodedText);
    if (onScanSuccess) onScanSuccess(decodedText, decodedResult);
  };

  const handleScanError = (err) => {
    console.warn('Scan error:', err);
    if (onScanError) onScanError(err);
  };

  return (
    <div className="p-4">
      <div id="qr-reader" className="w-full" />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <button onClick={onClose} className="btn-secondary mt-4">
        Close Scanner
      </button>
    </div>
  );
};

export default QRScanner;