import Joi from "joi";
import parse from "joi-to-json";

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchemaJson = parse(loginSchema);

type TLoginBody = {
  email: string;
  password: string;
};

export { loginSchema, loginSchemaJson, TLoginBody };
