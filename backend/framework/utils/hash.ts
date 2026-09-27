import crypto from "node:crypto";
import argon2 from "argon2";

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$DcYjJbNX7Eq+A/WIO9ZYaQ$3jC76ZFb7t1YHV5gJnoAwmBo0vY4Inui6mZDhQ7gDYw";

export const hash = {
  async password(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_OPTIONS);
  },

  async verify(hashedPassword: string, plain: string): Promise<boolean> {
    const hashToVerify = hashedPassword || DUMMY_HASH;
    return argon2.verify(hashToVerify, plain);
  },

  async token(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_OPTIONS);
  },

  async verifyToken(storedHash: string, plain: string): Promise<boolean> {
    return argon2.verify(storedHash, plain);
  },
};
