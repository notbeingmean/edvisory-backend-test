import bcrypt from "bcrypt";

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

export { hashPassword, comparePassword, filterBadWords, convertToDateTime };
