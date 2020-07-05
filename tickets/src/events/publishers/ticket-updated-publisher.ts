import {
  Publisher,
  Subjects,
  TicketUpdatedEvent,
} from "@acxmatos-gittix/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
