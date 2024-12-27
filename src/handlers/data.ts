import { FastifyRequest, FastifyReply } from "fastify";
import { stringify } from "csv-stringify";
import { write as writeExcel, utils as xlsxUtils } from "xlsx";
import { Account, Transaction } from "../entities";
import { DeepPartial } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { parseCSV, parseExcelFile, parseJSONFile } from "../libs/utils";

export async function importDataHandler(
  request: FastifyRequest<{ Querystring: { accountId: string } }>,
  reply: FastifyReply
) {
  const data = await request.file();
  if (!data) {
    return reply.status(400).send({ error: "No file uploaded" });
  }

  const format = data.mimetype.split("/")[1];
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const accountRepository = request.server.orm.getRepository(Account);

  const accountId = request.query.accountId;
  if (!accountId) {
    return reply.status(400).send({ error: "Account ID is missing" });
  }

  const account = await accountRepository.findOne({
    where: { id: accountId, user: { id: request.session.user.id } },
  });
  if (!account) {
    return reply.status(404).send({ error: "Account not found" });
  }

  try {
    let parsedData: DeepPartial<Transaction>[];

    switch (format) {
      case "csv":
        parsedData = await parseCSV(data, account);
        break;
      case "excel":
        parsedData = parseExcelFile(data, account);
        break;
      case "json":
        parsedData = parseJSONFile(data, account);
        break;
      default:
        return reply.status(400).send({ error: "Invalid format" });
    }

    await transactionRepository.save(parsedData);
    return reply.send({
      message: "Data imported successfully",
      data: parsedData,
    });
  } catch (error) {
    console.error("Error importing data:", error);
    return reply
      .status(500)
      .send({ error: "Error importing data", details: error });
  }
}

export async function exportDataHandler(
  request: FastifyRequest<{
    Querystring: { format: string; accountId?: string };
  }>,
  reply: FastifyReply
) {
  const { format, accountId } = request.query;
  const transactionRepository = request.server.orm.getRepository(Transaction);
  const data = accountId
    ? await transactionRepository.find({
        where: { account: { id: accountId } },
      })
    : await transactionRepository.find({
        where: { account: { user: { id: request.session.user.id } } },
      });

  const filePath = path.join(
    __dirname,
    "../../exports" + `/${format}`,
    `${request.session.user.id}-${new Date().toISOString()}.${format}`
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  switch (format) {
    case "csv":
      stringify(data, { header: true }, (err, output) => {
        if (err) {
          reply.status(500).send({ error: "Failed to export data" });
          return;
        }
        fs.writeFileSync(filePath, output);
        reply.header("Content-Type", "text/csv");
        reply.send(fs.createReadStream(filePath));
      });
      break;
    case "excel": {
      const worksheet = xlsxUtils.json_to_sheet(data);
      const workbook = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(workbook, worksheet, "Transactions");
      const buffer = writeExcel(workbook, { bookType: "xlsx", type: "buffer" });
      fs.writeFileSync(filePath, buffer);
      reply.header(
        "Content-Disposition",
        'attachment; filename="transactions.xlsx"'
      );
      reply.send(fs.createReadStream(filePath));
      break;
    }
    case "json":
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      reply.header("Content-Type", "application/json");
      reply.send(fs.createReadStream(filePath));
      break;
    default:
      reply.status(400).send({ error: "Invalid format" });
      return;
  }
}
