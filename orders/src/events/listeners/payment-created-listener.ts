import { Message } from "node-nats-streaming";
import {
  Listener,
  Subjects,
  PaymentCreatedEvent,
} from "@acxmatos-gittix/common";

import { queueGroupName } from "./queue-group-name";
import { Order, OrderStatus } from "../../models/order";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent["data"], msg: Message) {
    const order = await Order.findById(data.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    order.set({ status: OrderStatus.Complete });
    await order.save();

    // Ideally, we should publish an event of order updated right here!
    // For the context of this course, once an order goes to Complete state,
    // it is not expected that any other service is going to update the order
    // further (it's a final state). So, to save time, it won't be implemented.
    // It can be implemented in the future, if I have the guts to get back here!

    msg.ack();
  }
}
