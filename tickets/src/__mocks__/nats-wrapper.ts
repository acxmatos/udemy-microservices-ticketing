export const natsWrapper = {
  client: {
    publish: jest
      .fn()
      .mockImplementation(
        (subject: string, data: string, callback: () => void) => {
          console.log(
            `Mocking publishing subject = ${subject} with data = ${data}`
          );
          callback();
        }
      ),
  },
};
