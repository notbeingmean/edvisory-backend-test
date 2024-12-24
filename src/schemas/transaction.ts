import Joi from "joi";
import parse from "joi-to-json";

const transactionSchema = Joi.object({
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
  amount: Joi.number().required(),
  note: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional(),
});

const transactionSchemaJson = parse(transactionSchema);

type TTransactionBody = {
  file: never;
  data: string;
};

type TData = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  note?: string;
  imageUrl?: string;
};

export { transactionSchema, transactionSchemaJson, TTransactionBody, TData };
