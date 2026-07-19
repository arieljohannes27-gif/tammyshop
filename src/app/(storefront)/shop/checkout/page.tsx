import { CheckoutForm } from "@/components/lekka/CheckoutForm";

export const metadata = { title: "Checkout" };

export default function LekkaCheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-10 max-w-lg">
        <h1
          className="text-4xl"
          style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
        >
          Checkout
        </h1>
        <p className="mt-3 text-[var(--lekka-muted)]">
          Fast, one-thumb ready. Confirm your bag and we&apos;ll reserve the stock.
        </p>
      </header>
      <CheckoutForm />
    </div>
  );
}
