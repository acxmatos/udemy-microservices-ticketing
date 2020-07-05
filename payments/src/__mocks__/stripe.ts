export const stripe = {
  charges: {
    create: jest.fn().mockResolvedValue({ id: "mocked_stripe_charge_id" }),
  },
};
