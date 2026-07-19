import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { getStorefrontBusiness } from "@/lib/storefront";
import { getOrder, serializeOrder } from "@/services/commerce-order.service";

type Props = { params: Promise<{ id: string }> };

export default async function LekkaOrderPage({ params }: Props) {
  const { id } = await params;
  const business = await getStorefrontBusiness();
  const order = await getOrder(business.id, id);
  if (!order) notFound();
  const view = serializeOrder(order);

  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-28 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lekka-fresh)]">
        Order confirmed
      </p>
      <h1
        className="mt-3 text-4xl"
        style={{ fontFamily: "var(--font-lekka-display), Georgia, serif" }}
      >
        Thank you
      </h1>
      <p className="mt-3 text-[var(--lekka-muted)]">
        Your order <span className="font-semibold text-[var(--lekka-text)]">{view.orderNumber}</span>{" "}
        is reserved. Collect from the shop and pay on collection.
      </p>

      <div className="lekka-card mt-10 space-y-4 p-6">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--lekka-muted)]">Status</span>
          <span className="font-medium">{view.status}</span>
        </div>
        <ul className="space-y-2 border-y border-[var(--lekka-border)] py-4">
          {view.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 text-sm">
              <span>
                {i.quantity}× {i.productName}
              </span>
              <span>{formatCurrency(i.totalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(view.totalCents)}</span>
        </div>
      </div>

      <Link href="/shop/products" className="lekka-btn-primary mt-8 inline-flex w-full justify-center">
        Continue shopping
      </Link>
    </div>
  );
}
