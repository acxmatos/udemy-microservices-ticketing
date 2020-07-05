import { Subjects } from "./types/subjects";
import { OrderStatus } from "./types/order-status";

export interface OrderCreatedEvent {
  subject: Subjects.OrderCreated;
  data: {
    id: string;
    version: number;
    status: OrderStatus;
    userId: string;
    // Althow we have an expiresAt property on the order object
    // as a Date object, the date will be shared among services
    // as a string. The reason is that if a Date object is used,
    // whenever it is serialized in JSON (so it is automatically)
    // converted to a string, we will end up having a date with
    // a time portion based on the local timezone.
    // To make sure the date will be normalized among all services,
    // this property should have string representing the expiration
    // date as a UTC (Zulu) tiemzone.
    expiresAt: string;
    ticket: {
      id: string;
      price: number;
    };
  };
}
