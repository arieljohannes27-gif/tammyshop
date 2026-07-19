import { CartView } from "@/components/lekka/CartView";

export const metadata = { title: "Bag" };

export default function LekkaCartPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-10 max-w-lg">
        <h1 className="lekka-display text-4xl">Your bag</h1>
        <p className="mt-3 text-[var(--lekka-muted)]">
          Review what you’re collecting — we’ll reserve stock when you place the order.
        </p>
      </header>
      <CartView />
    </div>
  );
}
