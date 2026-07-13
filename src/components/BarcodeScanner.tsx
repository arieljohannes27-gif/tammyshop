"use client";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";

/** Retail formats common on SA grocery / Nestlé sachets (EAN-13 starts with 600…) */
const RETAIL_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export function normalizeBarcode(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  return digits || trimmed;
}

export function barcodeVariants(raw: string): string[] {
  const cleaned = normalizeBarcode(raw);
  const set = new Set<string>([cleaned, raw.trim()]);
  if (cleaned.length === 12) set.add(`0${cleaned}`);
  if (cleaned.length === 13 && cleaned.startsWith("0")) set.add(cleaned.slice(1));
  return [...set].filter(Boolean);
}

export function BarcodeScanner({
  mode = "in",
  onScan,
  onClose,
  title,
}: {
  mode?: "in" | "out";
  onScan: (barcode: string) => Promise<void> | void;
  onClose: () => void;
  title?: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const readerId = `barcode-reader-${reactId}`;
  const [status, setStatus] = useState("Starting camera…");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const processing = useRef(false);
  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  onScanRef.current = onScan;

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode(readerId, {
      formatsToSupport: RETAIL_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    const config = {
      fps: 15,
      // Wide box — sachets have small, often curved EAN barcodes
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const width = Math.floor(Math.min(viewfinderWidth * 0.94, 420));
        const height = Math.floor(Math.min(viewfinderHeight * 0.32, 200));
        return { width, height };
      },
      aspectRatio: 1.777778,
      disableFlip: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    };

    async function handleDecoded(decoded: string) {
      if (!mounted || processing.current) return;
      processing.current = true;
      const code = normalizeBarcode(decoded);
      setLastResult(code);
      setStatus(`Got it: ${code}`);
      try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(80);
        }
        try {
          if (scanner.isScanning) await scanner.pause(true);
        } catch {
          /* pause optional */
        }
        await onScanRef.current(code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan handling failed");
        processing.current = false;
        try {
          if (scanner.isScanning) await scanner.resume();
        } catch {
          /* ignore */
        }
      }
    }

    async function start() {
      try {
        await scanner.start({ facingMode: "environment" }, config, handleDecoded, () => {});
        if (mounted) {
          setStatus("Hold phone steady over the barcode — fill the box");
          setError(null);
        }
      } catch {
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (!mounted) return;
          if (!cameras.length) {
            setError("No camera found. Type the barcode numbers under the package.");
            setStatus("");
            return;
          }
          // Prefer last camera (often rear on phones)
          const cam = cameras[cameras.length - 1];
          await scanner.start(cam.id, config, handleDecoded, () => {});
          if (mounted) {
            setStatus("Hold phone steady over the barcode — fill the box");
            setError(null);
          }
        } catch {
          if (mounted) {
            setError(
              "Camera needs a secure (https) link on phones. Open TammyShop via the QR on /open-on-phone after the HTTPS tunnel is running — or allow camera permission for this site in phone Settings."
            );
            setStatus("");
          }
        }
      }
    }

    start();

    return () => {
      mounted = false;
      const s = scannerRef.current;
      if (s?.isScanning) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [readerId]);

  async function toggleTorch() {
    const s = scannerRef.current;
    if (!s?.isScanning) return;
    try {
      await s.applyVideoConstraints({
        // torch is supported on many Android phones but not in TS MediaTrack types
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn((v) => !v);
    } catch {
      setError("Torch not supported on this phone — use good light instead.");
    }
  }

  async function submitManual() {
    const code = normalizeBarcode(manualCode);
    if (!code) return;
    setStatus(`Using: ${code}`);
    await onScanRef.current(code);
    setManualCode("");
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between gap-2 p-4 text-white">
        <button type="button" onClick={onClose} className="text-lg font-medium">
          ✕ Close
        </button>
        <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">
          {title || (mode === "in" ? "ADD STOCK" : "SCAN")}
        </span>
        <button type="button" onClick={toggleTorch} className="text-sm font-medium text-white/90">
          {torchOn ? "Light off" : "Light"}
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          id={readerId}
          className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover [&_img]:hidden"
        />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6">
          <div className="mx-auto h-28 max-w-md rounded-2xl border-2 border-accent/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
      </div>

      <div className="shrink-0 space-y-3 bg-black/95 p-4 text-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        {status && !error ? <p className="text-center text-sm text-green-400">{status}</p> : null}
        {lastResult ? <p className="text-center text-xs text-white/50">Last read: {lastResult}</p> : null}
        {error ? <p className="text-center text-sm text-amber-300">{error}</p> : null}

        <p className="text-center text-xs text-white/70">
          Tip for sachets: flatten the pack, good light, move closer until the bars fill the box.
        </p>

        <div className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Type digits under barcode (e.g. 6001067…)"
            className="flex-1 bg-white text-black"
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            inputMode="numeric"
            autoComplete="off"
          />
          <Button onClick={submitManual} className="shrink-0 px-5">
            Go
          </Button>
        </div>
      </div>
    </div>
  );
}
