import { CheckoutForm } from "@/components/lekka/CheckoutForm";

export const metadata = { title: "Checkout" };

export default function LekkaCheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-10 max-w-lg">
        <h1 className="lekka-display text-4xl">Almost there</h1>
        <p className="mt-3 text-[var(--lekka-muted)]">
          Leave your details, we&apos;ll reserve your bag. Collect from the shop and pay then —
          simple neighbourhood hospitality.
        </p>
      </header>
      <CheckoutForm />
    </div>
  );
}
