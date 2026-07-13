import { createHash } from "crypto";
import { PRICING } from "@/types";

const FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

function pfEncode(value: string) {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

export function isPayFastConfigured() {
  return Boolean(
    process.env.PAYFAST_MERCHANT_ID &&
      process.env.PAYFAST_MERCHANT_KEY &&
      process.env.PAYFAST_PASSPHRASE,
  );
}

export function getPayFastHost() {
  const sandbox = process.env.PAYFAST_SANDBOX !== "false";
  return sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";
}

export function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string | null,
) {
  const parts: string[] = [];
  for (const key of FIELD_ORDER) {
    const val = data[key];
    if (val !== undefined && val !== "") {
      parts.push(`${key}=${pfEncode(val)}`);
    }
  }
  let paramString = parts.join("&");
  if (passphrase) {
    paramString += `&passphrase=${pfEncode(passphrase)}`;
  }
  return createHash("md5").update(paramString).digest("hex");
}

/** Checkout signatures use attribute order. ITN signatures use posted field order. */
export function verifyPayFastItnSignature(
  data: Record<string, string>,
  passphrase?: string | null,
) {
  const received = data.signature;
  if (!received) return false;

  const parts: string[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === "signature") continue;
    if (val === undefined || val === "") continue;
    parts.push(`${key}=${pfEncode(val)}`);
  }
  let paramString = parts.join("&");
  if (passphrase) {
    paramString += `&passphrase=${pfEncode(passphrase)}`;
  }
  return createHash("md5").update(paramString).digest("hex") === received;
}

export function verifyPayFastSignature(
  data: Record<string, string>,
  passphrase?: string | null,
) {
  const received = data.signature;
  if (!received) return false;
  const copy = { ...data };
  delete copy.signature;
  return generatePayFastSignature(copy, passphrase) === received;
}

export function formatZar(amount: number) {
  return amount.toFixed(2);
}

export async function createPayFastCheckout(params: {
  businessId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  plan: "STARTER" | "ADVANCED";
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE;

  if (!merchantId || !merchantKey || !passphrase) {
    return {
      simulated: true as const,
      url: `${appUrl}/billing/success?plan=${params.plan}&simulated=1`,
    };
  }

  const amount = formatZar(PRICING[params.plan].monthlyZar);
  const mPaymentId = `${params.businessId.slice(0, 8)}-${Date.now()}`;
  const itemName = `TammyShop ${PRICING[params.plan].label} subscription`;

  const fields: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${appUrl}/billing/success?plan=${params.plan}`,
    cancel_url: `${appUrl}/subscribe?cancelled=1`,
    notify_url: `${appUrl}/api/billing/webhook`,
    name_first: (params.firstName || "TammyShop").slice(0, 100),
    name_last: (params.lastName || "Owner").slice(0, 100),
    email_address: params.email,
    m_payment_id: mPaymentId,
    amount,
    item_name: itemName,
    item_description: `Monthly ${params.plan} plan`,
    custom_str1: params.businessId,
    custom_str2: params.plan,
    subscription_type: "1",
    recurring_amount: amount,
    frequency: "3", // monthly
    cycles: "0", // indefinite
  };

  fields.signature = generatePayFastSignature(fields, passphrase);

  return {
    simulated: false as const,
    action: `https://${getPayFastHost()}/eng/process`,
    fields,
    mPaymentId,
  };
}

export async function validatePayFastItn(paramString: string) {
  const host = getPayFastHost();
  const res = await fetch(`https://${host}/eng/query/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: paramString,
  });
  const text = (await res.text()).trim();
  return text === "VALID";
}
