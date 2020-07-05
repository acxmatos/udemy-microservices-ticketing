import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { body } from "express-validator";
import {
  requireAuth,
  validateRequest,
  OrderStatus,
  NotFoundError,
  BadRequestError,
} from "@acxmatos-gittix/common";

import { Ticket } from "../models/ticket";
import { Order } from "../models/order";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 1 * 60;

router.post(
  "/api/orders",
  requireAuth,
  [
    body("ticketId")
      .not()
      .isEmpty()
      // this check will potentially create a dependency with the
      // Tickets service, since we are assuming it uses MongoDB as
      // a database. If the Tickets service changes the database
      // or uses a totally different id structure, the Orders service
      // will break and we won't be able to create new orders.
      // this is just something we need to keep in mind!
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("TicketId must be provided"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;

    // Find the ticket the user is trying to order in the database
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    // Make sure that this ticket is not already reserved
    const isReserved = await ticket.isReserved();
    if (isReserved) {
      throw new BadRequestError("Ticket is already reserved");
    }

    // Calculate an expiration date for this order
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // Build the order and save it to the database
    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
      ticket,
    });
    await order.save();

    // Publish an event saying that an order was created
    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      status: order.status,
      userId: order.userId,
      // Althow we have an expiresAt property on the order object
      // as a Date object, the date will be shared among services
      // as a string. The reason is that if a Date object is used,
      // whenever it is serialized in JSON (so it is automatically)
      // converted to a string, we will end up having a date with
      // a time portion based on the local timezone.
      // To make sure the date will be normalized among all services,
      // this property should have string representing the expiration
      // date as a UTC (Zulu) tiemzone.
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    });

    res.status(201).send(order);
  }
);

export { router as newOrderRouter };
