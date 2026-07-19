import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "TammyShop Commerce API",
    version: "1.0.0",
    description:
      "Versioned commerce API for Lekka Stop Shop and integrations. Authenticate with X-Api-Key (tsk_live_…) or Admin session cookie.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "apiKey", in: "header", name: "X-Api-Key" },
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "API Key" },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          sellPriceCents: { type: "integer" },
          quantityAvailable: { type: "number" },
          currencyCode: { type: "string", example: "ZAR" },
        },
      },
      CheckoutRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "string", format: "uuid" },
                quantity: { type: "number", exclusiveMinimum: 0 },
              },
            },
          },
          customerEmail: { type: "string", format: "email" },
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          couponCode: { type: "string" },
          notes: { type: "string" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "string" },
          status: { type: "string" },
          totalCents: { type: "integer" },
          items: { type: "array", items: { type: "object" } },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
  paths: {
    "/catalog/products": {
      get: {
        summary: "List catalog products",
        parameters: [{ name: "q", in: "query", schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Product list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/catalog/products/{id}": {
      get: {
        summary: "Get product",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Product" },
          "404": { description: "Not found" },
        },
      },
    },
    "/checkout": {
      post: {
        summary: "Create online order (idempotent)",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Replay-safe checkout key per business",
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CheckoutRequest" } } },
        },
        responses: {
          "201": { description: "Order created" },
          "200": { description: "Idempotent replay" },
          "409": { description: "Stock or idempotency conflict" },
        },
      },
    },
    "/orders": {
      get: {
        summary: "List orders",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Orders" } },
      },
    },
    "/orders/{id}": {
      get: {
        summary: "Get order",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Order" }, "404": { description: "Not found" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
