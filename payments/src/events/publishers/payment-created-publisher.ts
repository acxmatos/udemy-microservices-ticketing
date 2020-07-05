import {
  Publisher,
  Subjects,
  PaymentCreatedEvent,
} from "@acxmatos-gittix/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
