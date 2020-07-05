import request from "supertest";
import mongoose from "mongoose";
import Stripe from "stripe";

import { app } from "../../app";
import { Order, OrderStatus } from "../../models/order";
import { Payment } from "../../models/payment";
import { stripe } from "../../stripe";

jest.mock("../../stripe");

it("returns an error if an invalid orderId is provided", async () => {
  // Empty orderId
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "token",
      orderId: "",
    })
    .expect(400);

  // Invalid orderId format
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "token",
      orderId: "orderId",
    })
    .expect(400);

  // No orderId at all
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "token",
    })
    .expect(400);
});

it("returns an error if an invalid token is provided", async () => {
  // Empty token
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "",
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(400);

  // No token at all
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(400);
});

it("returns a 404 when purchasing an order that does not exist", async () => {
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "token",
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it("returns a 401 when purchasing an order that doesnt belong to the user", async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created,
  });
  await order.save();

  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "token",
      orderId: order.id,
    })
    .expect(401);
});

it("returns a 400 when purchasing a cancelled order", async () => {
  const userId = mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
  });
  await order.save();

  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin(userId))
    .send({
      token: "token",
      orderId: order.id,
    })
    .expect(400);
});

it("returns a 201 with valid inputs", async () => {
  const token = "tok_visa";
  const price = 20;
  const currency = "usd";
  const userId = mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });
  await order.save();

  const response = await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin(userId))
    .send({
      token,
      orderId: order.id,
    })
    .expect(201);

  const chargeOptions = (stripe.charges.create as jest.Mock).mock
    .calls[0][0] as Stripe.ChargeCreateParams;

  expect(stripe.charges.create).toHaveBeenCalled();
  expect(chargeOptions.source).toEqual(token);
  expect(chargeOptions.amount).toEqual(price * 100);
  expect(chargeOptions.currency).toEqual(currency);

  const payment = await Payment.findOne({
    orderId: order.id,
  });
  expect(payment).not.toBeNull();
  expect(response.body.id).toEqual(payment!.id);
});
