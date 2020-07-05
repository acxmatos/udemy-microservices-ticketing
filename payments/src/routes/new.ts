import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { body } from "express-validator";
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
} from "@acxmatos-gittix/common";

import { stripe } from "../stripe";
import { natsWrapper } from "../nats-wrapper";
import { Order, OrderStatus } from "../models/order";
import { Payment } from "../models/payment";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";

const router = express.Router();

router.post(
  "/api/payments",
  requireAuth,
  [
    body("token").not().isEmpty().withMessage("Token must be provided"),
    body("orderId")
      .not()
      .isEmpty()
      // this check will potentially create a dependency with the
      // Orders service, since we are assuming it uses MongoDB as
      // a database. If the Orders service changes the database
      // or uses a totally different id structure, the Payments
      // service will break and we won't be able to create new
      // payments.
      // this is just something we need to keep in mind!
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("OrderId must be provided"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError("Cannot pay for a cancelled order");
    }

    const stripeResponse = await stripe.charges.create({
      currency: "usd",
      amount: order.price * 100, // convert to cents
      source: token,
      description: `Charge for orderId #${order.id}`,
    });

    const payment = Payment.build({
      orderId: order.id,
      chargeId: stripeResponse.id,
    });
    await payment.save();

    await new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      chargeId: payment.chargeId,
    });

    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
