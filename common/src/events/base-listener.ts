import { Message, Stan } from "node-nats-streaming";

import { Subjects } from "./types/subjects";

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Listener<T extends Event> {
  abstract subject: T["subject"];
  abstract queueGroupName: string;
  abstract onMessage(data: T["data"], msg: Message): void;

  protected client: Stan;
  protected ackWait = 5 * 1000; // default: 5s

  constructor(client: Stan) {
    this.client = client;
  }

  subscriptionOptions() {
    return (
      this.client
        // default behavior: whenever a client receives an event, NATS consider it done
        //                   if an error occurs while client processed the event, it will be LOST!
        .subscriptionOptions()
        // asks NATS to resend all messages that exists for this channel when
        // a subscription is created and/or connected
        // this is still needed in parallel with durable subscription in
        // order to make sure all messages will be sent to a client that
        // subscribed to a channel for the very first time
        .setDeliverAllAvailable()
        // overrides default behavior and forces client to ack the message
        // if no ack is received within an ammount of time (let's say, 30s),
        // NATS will resend the message to the queue group or other clients
        // that are subscribed to that channel
        .setManualAckMode(true)
        // durable subscription makes sure messages that were ack'd are
        // marked as "processed" and will not send those whenever a
        // subscription to this channel is created and/or connected
        .setDurableName(this.queueGroupName)
        .setAckWait(this.ackWait)
    );
  }

  listen() {
    // queue groups = make sure only ONE client subscribed to that group
    // will receive the message (useful for events that can't be handled
    // more than once)
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName,
      this.subscriptionOptions()
    );

    subscription.on("message", (msg: Message) => {
      console.log(
        `Message #${msg.getSequence()} received: ${this.subject} / ${
          this.queueGroupName
        }`
      );

      const parsedData = this.parseMessage(msg);
      this.onMessage(parsedData, msg);
    });
  }

  parseMessage(msg: Message) {
    const data = msg.getData();
    return typeof data === "string"
      ? JSON.parse(data)
      : JSON.parse(data.toString("utf-8"));
  }
}
