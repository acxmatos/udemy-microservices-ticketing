import {
  Subjects,
  Publisher,
  ExpirationCompleteEvent,
} from "@acxmatos-gittix/common";

export class ExpirationCompletePublisher extends Publisher<
  ExpirationCompleteEvent
> {
  readonly subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
