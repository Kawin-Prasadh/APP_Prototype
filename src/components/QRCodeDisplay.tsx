import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ value, size = 120, className = '' }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(
      value,
      {
        width: size * 2,
        margin: 1,
        color: {
          dark: '#17253a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) {
          setDataUrl(url);
        }
      }
    );

    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#17253a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR rendering error', error);
        }
      );
    }
  }, [value, size]);

  return (
    <div className={`qr-box ${className}`}>
      {dataUrl ? (
        <img src={dataUrl} alt={`QR Code for ${value}`} width={size} height={size} />
      ) : (
        <canvas ref={canvasRef} width={size} height={size} />
      )}
    </div>
  );
}
