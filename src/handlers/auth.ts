import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "../entities";
import { hashPassword, comparePassword } from "../libs/utils";

type TRegisterBody = {
  name: string;
  email: string;
  password: string;
};

type TLoginBody = {
  email: string;
  password: string;
};

export async function handleSignup(
  request: FastifyRequest<{ Body: TRegisterBody }>,
  reply: FastifyReply
) {
  const { name, email, password } = request.body;
  const userRepository = request.server.orm.getRepository(User);
  try {
    const existingUser = await userRepository.findOne({
      where: [{ email }, { name }],
    });

    if (existingUser) {
      return reply.status(400).send("User already exists");
    }

    const newUser = userRepository.create({
      name,
      email,
      password: await hashPassword(password),
    });

    await userRepository.save(newUser);
    return reply.send({ name, email });
  } catch (err) {
    return reply.status(500).send("Failed to save user" + err);
  }
}

export async function handleSignin(
  request: FastifyRequest<{ Body: TLoginBody }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;
  const userRepository = request.server.orm.getRepository(User);

  try {
    const user = await userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return reply.status(404).send("User not found");
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return reply.status(401).send("Invalid password");
    }

    if (!user.id) {
      return reply.status(500).send("Invalid user ID");
    }

    request.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return reply.send({ message: "Logged in", user: user.name });
  } catch (err) {
    return reply.status(500).send("Failed to login: " + err);
  }
}

export async function handleSignout(
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.session.destroy();
  return reply.send({ message: "Logged out", user: request.session.user });
}
