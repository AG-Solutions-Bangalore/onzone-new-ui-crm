import React, { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

const ScannerModel = ({ barcodeScannerValue }) => {
  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      detectedCodes.forEach((code) => {
        console.log("Scanned Code Raw Value:", code.rawValue);
        barcodeScannerValue(code.rawValue);
      });
    }
  };
  const barcodeFormats = [
    "code_128",
    "code_39",
    "code_93",
    "codabar",
    "ean_13",
    "ean_8",
    "upc_a",
    "upc_e",
    "itf",
  ];

  const scannerStyles = {
    container: {
      width: "100%",
      maxWidth: "280px", // Compact size for mobile
      height: "auto",
    },
    video: {
      width: "100%",
      height: "auto",
      maxHeight: "220px",
      objectFit: "cover",
    },
  };
  return (
    <div className="w-full flex justify-center">
      <Scanner
        formats={barcodeFormats}
        onScan={handleScan}
        onError={(error) => console.error(error)}
        className="w-full max-w-xs"
        styles={scannerStyles}
      />
    </div>
  );
};
//sajidd

export default ScannerModel;
