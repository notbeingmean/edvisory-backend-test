import Joi from "joi";
import parse from "joi-to-json";

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchemaJson = parse(registerSchema);

type TRegisterBody = {
  name: string;
  email: string;
  password: string;
};

export { registerSchema, registerSchemaJson, TRegisterBody };
