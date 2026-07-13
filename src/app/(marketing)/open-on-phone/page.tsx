"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

const PHONE_URL = "https://completely-show-certificate-village.trycloudflare.com/inventory/scan-stock";
const LOGIN_URL = "https://completely-show-certificate-village.trycloudflare.com/login";

export default function OpenOnPhonePage() {
  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4 py-10">
      <Card elevated className="w-full max-w-md text-center">
        <p className="label-caps text-primary">Phone camera</p>
        <h1 className="mt-2 text-2xl font-bold">Scan this fresh QR</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Old QR links expire. Use this one, then allow camera on your phone.
        </p>

        <div className="mx-auto mt-6 w-72 overflow-hidden rounded-2xl border border-border bg-white p-3">
          <Image
            src={`/phone-scan.png?v=3`}
            alt="QR code to open TammyShop on phone"
            width={640}
            height={640}
            className="h-auto w-full"
            priority
            unoptimized
          />
        </div>

        <ol className="mt-5 space-y-2 text-left text-sm text-text-secondary">
          <li>1. Scan with your phone Camera app</li>
          <li>2. Log in</li>
          <li>3. Allow camera</li>
          <li>4. Scan product barcodes</li>
        </ol>

        <p className="mt-4 break-all text-xs text-text-muted">{PHONE_URL}</p>

        <div className="mt-6 flex flex-col gap-2">
          <a href={LOGIN_URL} target="_blank" rel="noreferrer">
            <Button className="w-full">Open login link</Button>
          </a>
          <Link href="/login">
            <Button className="w-full" variant="secondary">
              Stay on Mac
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
