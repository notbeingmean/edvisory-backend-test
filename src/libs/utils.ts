/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import { Account, Transaction } from "../entities";
import { DeepPartial } from "typeorm";
import { parse } from "csv-parse";
import { read as parseExcel, utils as xlsxUtils } from "xlsx";

async function hashPassword(password: string) {
  const hashedPassword = bcrypt.hash(
    password,
    parseInt(process.env.SALT_ROUNDS)
  );
  return hashedPassword;
}

async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const isValid = bcrypt.compare(password, hashedPassword);
  return isValid;
}

function filterBadWords(text: string) {
  const badWords = [
    "ควย",
    "เหี้ย",
    "สัส",
    "มึง",
    "กู",
    "ไอ้",
    "ระยำ",
    "ดอกทอง",
    "อีดอก",
    "สันดาน",
    "ส้นตีน",
    "หน้าด้าน",
    "แม่ง",
  ];
  return badWords.reduce((acc, word) => {
    return acc.replace(word, "***");
  }, text);
}

function convertToDateTime(date: string) {
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;

  const match = date.match(regex);

  if (match) {
    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    date.setHours(date.getHours() + 7);
    console.log(date); // 2024-12-25T00:00:00.000Z
    return date;
  } else {
    throw new Error("Invalid date format");
  }
}

async function parseCSV(
  data: any,
  account: Account
): Promise<DeepPartial<Transaction>[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of data.file) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const output = await new Promise<any[]>((resolve, reject) => {
    parse(buffer, { columns: true }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
  return output.map((row: any) => ({
    ...row,
    account: account,
  }));
}

function parseExcelFile(
  data: any,
  account: Account
): DeepPartial<Transaction>[] {
  const workbook = parseExcel(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsxUtils.sheet_to_json(worksheet).map((row: any) => ({
    ...row,
    account: account,
  }));
}

function parseJSONFile(
  data: any,
  account: Account
): DeepPartial<Transaction>[] {
  return JSON.parse(data.toString()).map((row: any) => ({
    ...row,
    account: account,
  }));
}

export {
  hashPassword,
  comparePassword,
  filterBadWords,
  convertToDateTime,
  parseCSV,
  parseExcelFile,
  parseJSONFile,
};
