import {
  Publisher,
  OrderCreatedEvent,
  Subjects,
} from "@acxmatos-gittix/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
