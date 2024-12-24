import Joi from "joi";
import parse from "joi-to-json";

const accountSchema = Joi.object({
  accountName: Joi.string().required(),
  balance: Joi.number().required(),
});

const accountSchemaJson = parse(accountSchema);

type TAccountBody = {
  accountName: string;
  balance: number;
};

export { accountSchema, accountSchemaJson, TAccountBody };
