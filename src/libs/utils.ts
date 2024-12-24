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

export { hashPassword, comparePassword };
