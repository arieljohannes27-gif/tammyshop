"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <div className="gradient-hero flex min-h-dvh items-center justify-center px-4">
      <Card elevated className="w-full max-w-md text-center">
        <p className="label-caps text-primary">Account pending</p>
        <h1 className="mt-2 text-2xl font-bold">Waiting for admin approval</h1>
        <p className="mt-3 text-sm text-text-secondary">
          Your shop is registered. A TammyShop admin must approve your account before you can pay and
          start using inventory and POS.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.replace("/login");
            }}
          >
            Log out
          </Button>
          <Link href="/" className="text-sm text-primary">
            Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
}
