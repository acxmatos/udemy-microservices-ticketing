import {
  Publisher,
  OrderCancelledEvent,
  Subjects,
} from "@acxmatos-gittix/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
