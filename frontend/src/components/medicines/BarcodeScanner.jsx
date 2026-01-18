import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function BarcodeScanner({ onScan }) {
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

  const startScanning = () => {
    setScanning(true)
    const scanner = new Html5QrcodeScanner(
      'barcode-scanner',
      {
        qrbox: { width: 250, height: 250 },
        fps: 5,
      },
      false
    )

    scanner.render(
      (decodedText) => {
        onScan(decodedText)
        scanner.clear()
        setScanning(false)
      },
      (error) => {
        // Ignore scan errors
      }
    )

    scannerRef.current = scanner
  }

  return (
    <div className="p-4">
      {!scanning ? (
        <button
          onClick={startScanning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Start Camera Scan
        </button>
      ) : (
        <div>
          <div id="barcode-scanner"></div>
          <button
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.clear()
              }
              setScanning(false)
            }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Stop Scanning
          </button>
        </div>
      )}
    </div>
  )
}

