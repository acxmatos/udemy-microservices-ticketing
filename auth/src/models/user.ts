import mongoose from "mongoose";

import { Password } from "../services/password";

// An interface that describes the properties
// that are required to create a new User
interface UserAttrs {
  email: string;
  password: string;
}

// An interface that describes the properties
// that a User Model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// An interface that describes the properties
// that a User Document has
interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
}, {
  toJSON: {
    transform(doc, ret) {
      
      // Reassign _id to id
      ret.id = ret._id;
      delete ret._id;

      // Delete password
      delete ret.password;
      
      // Can be used to delete __v
      // We chose setting the versionKey
      // property (below), which does
      // exactly what we need
      // delete ret.__v;
    },
    versionKey: false
  }
});

// We use function syntax (instead of an arrow function)
// to enable us to use the "this" inside the function
userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

// Enforces User type check (use this instead of
// creating an instance using the "new" operator)
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
