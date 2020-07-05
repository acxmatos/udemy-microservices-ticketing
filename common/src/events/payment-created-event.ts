import { Subjects } from "./types/subjects";

export interface PaymentCreatedEvent {
  subject: Subjects.PaymentCreated;
  data: {
    id: string;
    orderId: string;
    chargeId: string;
  };
}
