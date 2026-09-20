const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);
const PREFIX = "scrypt";
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function isScryptHash(value) {
  return typeof value === "string" && value.startsWith(`${PREFIX}$`);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `${PREFIX}$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${derived.toString("hex")}`;
}

async function verifyScryptPassword(password, encoded) {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4];
  const expected = Buffer.from(parts[5], "hex");
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || expected.length !== KEY_LENGTH) {
    return false;
  }

  const actual = await scryptAsync(password, salt, KEY_LENGTH, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return crypto.timingSafeEqual(actual, expected);
}

function verifyLegacyPassword(password, storedPassword) {
  const supplied = Buffer.from(password, "utf8");
  const stored = Buffer.from(storedPassword, "utf8");
  return supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

module.exports = {
  hashPassword,
  hashToken,
  isScryptHash,
  verifyLegacyPassword,
  verifyScryptPassword,
};
