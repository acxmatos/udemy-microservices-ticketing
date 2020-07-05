import request from "supertest";
import mongoose from "mongoose";

import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import { natsWrapper } from "../../nats-wrapper";

it("returns a 404 if the provided id does not exist", async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .put(`/api/tickets/${id}`)
    .set("Cookie", global.signin())
    .send({
      title: "Title",
      price: 20,
    })
    .expect(404);
});

it("returns a 401 if the user is not authenticated", async () => {
  const id = new mongoose.Types.ObjectId().toHexString();

  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: "Title",
      price: 20,
    })
    .expect(401);
});

it("returns if 401 if the user does not own the ticket", async () => {
  const originalTitle = "Title 1";
  const originalPrice = 20;

  const updatedTitle = "Title 2";
  const updatedPrice = 30;

  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", global.signin())
    .send({
      title: originalTitle,
      price: originalPrice,
    });

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", global.signin())
    .send({
      title: updatedTitle,
      price: updatedPrice,
    })
    .expect(401);

  const originalTicketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);

  expect(originalTicketResponse.body.title).toEqual(originalTitle);
  expect(originalTicketResponse.body.price).toEqual(originalPrice);
});

it("returns a 400 if the user provides an invalid title or price", async () => {
  const cookie = global.signin();

  const title = "Title";
  const price = 20;

  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({
      title,
      price,
    });

  // Invalid title
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title: "",
      price,
    })
    .expect(400);

  // No title at all
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      price,
    })
    .expect(400);

  // Invalid price
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title,
      price: -20,
    })
    .expect(400);

  // No price at all
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title,
    })
    .expect(400);
});

it("updates the ticket with provided valid inputs", async () => {
  const cookie = global.signin();

  const originalTitle = "Title 1";
  const originalPrice = 20;
  const updatedTitle = "Title 2";
  const updatedPrice = 30;

  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({
      title: originalTitle,
      price: originalPrice,
    });

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title: updatedTitle,
      price: updatedPrice,
    })
    .expect(200);

  const originalTicketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);

  expect(originalTicketResponse.body.title).toEqual(updatedTitle);
  expect(originalTicketResponse.body.price).toEqual(updatedPrice);
});

it("publishes an event", async () => {
  const cookie = global.signin();

  const originalTitle = "Title 1";
  const originalPrice = 20;
  const updatedTitle = "Title 2";
  const updatedPrice = 30;

  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({
      title: originalTitle,
      price: originalPrice,
    });

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title: updatedTitle,
      price: updatedPrice,
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it("rejects updates if the ticket is reserved", async () => {
  const cookie = global.signin();

  const originalTitle = "Title 1";
  const originalPrice = 20;
  const updatedTitle = "Title 2";
  const updatedPrice = 30;

  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({
      title: originalTitle,
      price: originalPrice,
    });

  const ticket = await Ticket.findById(response.body.id);
  ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() });
  await ticket!.save();

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title: updatedTitle,
      price: updatedPrice,
    })
    .expect(400);
});
