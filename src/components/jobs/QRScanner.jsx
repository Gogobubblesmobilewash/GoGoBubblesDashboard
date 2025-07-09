import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import useStore from '../../store/useStore';
import { useAuth } from '../../store/AuthContext';

const QRScanner = ({ onScanSuccess, onScanError, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const { isAdmin, canDoLaundry } = useAuth();

  const handleScanSuccess = (decodedText) => {
    if (onScanSuccess) {
      onScanSuccess(decodedText);
    }
  };

  const handleScanError = (error) => {
    console.error('QR Scan error:', error);
    if (onScanError) {
      onScanError(error);
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(handleScanSuccess, handleScanError);
    setScanning(true);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only allow access to bubblers who can do laundry or admins
  if (!canDoLaundry && !isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="text-lg font-medium text-gray-900 mb-2">Access Restricted</div>
        <div className="text-gray-600 mb-4">QR Scanner is only available for laundry service bubblers.</div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full" />
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

QRScanner.propTypes = {
  onClose: PropTypes.func.isRequired,
  onScanError: PropTypes.func,
  onScanSuccess: PropTypes.func
};

QRScanner.defaultProps = {
  onScanError: null,
  onScanSuccess: null
};

export default QRScanner;