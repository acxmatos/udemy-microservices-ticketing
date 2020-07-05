import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import {
  OrderCancelledEvent,
  TicketUpdatedEvent,
} from "@acxmatos-gittix/common";

import { OrderCancelledListener } from "../order-cancelled-listener";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: "Title",
    price: 20,
    userId: mongoose.Types.ObjectId().toHexString(),
  });

  // TicketAttrs interface does not have a orderId property
  // That's why we can't set it in the build call
  // The ticket instance built is of type TicketDoc, which
  // indeed has the orderId property, so we just need to set
  // it like we did below
  ticket.set({ orderId });
  await ticket.save();

  const data: OrderCancelledEvent["data"] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, ticket };
};

it("updates the orderId of the ticket", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(data.ticket.id);

  expect(updatedTicket!.orderId).not.toBeDefined();
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it("publishes a ticket updated event", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  ) as TicketUpdatedEvent["data"];
  expect(data.ticket.id).toEqual(ticketUpdatedData.id);
});
