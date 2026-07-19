import { CartView } from "@/components/lekka/CartView";

export const metadata = { title: "Bag" };

export default function LekkaCartPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8">
      <header className="mb-10">
        <h1
          className="text-4xl"
          style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
        >
          Your bag
        </h1>
      </header>
      <CartView />
    </div>
  );
}
