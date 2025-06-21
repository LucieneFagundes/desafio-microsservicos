import "@opentelemetry/auto-instrumentations-node/register";
import { fastify } from "fastify";
import { z } from "zod";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/index.ts";
import { dispatchOrderCreated } from "../broker/messages/order-created.ts";
import fastifyCors from "@fastify/cors";
import { trace } from "@opentelemetry/api";
import { setTimeout } from "node:timers/promises";
import { tracer } from "../tracer/tracer.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, { origin: "*" });

app.get("/health", () => {
  return "OK";
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body as { amount: number };

    console.log("[Orders] New order received:", { amount });

    const orderId = crypto.randomUUID();
    await db.insert(schema.orders).values({
      id: orderId,
      customerId: "751a92ae-f274-48b9-ab32-e39e13655ccf",
      amount,
      status: "pending",
    });

    const span = tracer.startSpan("Temos um problema aqui");

    span.setAttribute("teste", "Hello World");
    await setTimeout(2000);

    trace.getActiveSpan()?.setAttribute("order.id", orderId);

    dispatchOrderCreated({
      orderId,
      amount,
      costumer: {
        id: "751a92ae-f274-48b9-ab32-e39e13655ccf",
      },
    });

    return reply.status(201).send();
  }
);

app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
  console.log("[Orders] HTTP Server Running!");
});
