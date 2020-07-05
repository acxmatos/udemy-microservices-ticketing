import {
  Publisher,
  Subjects,
  TicketCreatedEvent,
} from "@acxmatos-gittix/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject: Subjects.TicketCreated = Subjects.TicketCreated;
}
