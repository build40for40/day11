import type { Sql } from "./sql.js";
import type { HolidayMode } from "./sanitize.js";

export interface Household {
  id: string;
  setup_token_hash: string | null;
  setup_expires_at: string | null;
  parent_token: string;
  parent_email: string | null;
  email_verified_at: string | null;
  verify_token_hash: string | null;
  answers_approved_at: string | null;
  grownup_label: string;
  holiday_mode: string;
  created_at: string;
}

export interface Kid {
  id: string;
  household_id: string;
  first_name: string | null;
  age: number | null;
  status: string;
  uid_hash: string | null;
  paired_at: string | null;
  created_at: string;
}

export interface Pairing {
  id: string;
  device_id: string;
  kid_id: string;
  expires_at: string;
  used_at: string | null;
}

export async function insertHousehold(
  sql: Sql,
  row: {
    id: string;
    setupHash: string;
    expiresAt: string;
    parentToken: string;
    demo: boolean;
    createdAt: string;
  },
): Promise<void> {
  await sql.run(
    `insert into households (
      id, setup_token_hash, setup_expires_at, parent_token, verify_token_hash, created_at
    ) values (?, ?, ?, ?, ?, ?)`,
    row.id,
    row.setupHash,
    row.expiresAt,
    row.parentToken,
    row.demo ? "demo" : null,
    row.createdAt,
  );
}

export async function householdBySetupHash(sql: Sql, hash: string): Promise<Household | undefined> {
  return sql.get<Household>("select * from households where setup_token_hash = ?", hash);
}

export async function householdByVerifyHash(sql: Sql, hash: string): Promise<Household | undefined> {
  return sql.get<Household>("select * from households where verify_token_hash = ?", hash);
}

export async function householdById(sql: Sql, id: string): Promise<Household | undefined> {
  return sql.get<Household>("select * from households where id = ?", id);
}

export async function saveSetup(
  sql: Sql,
  row: {
    id: string;
    email: string;
    grownup: string;
    holiday: HolidayMode;
    approvedAt: string;
    verifyHash: string | null;
    verifiedAt: string | null;
  },
): Promise<void> {
  await sql.run(
    `update households set
      parent_email = ?, grownup_label = ?, holiday_mode = ?, answers_approved_at = ?,
      verify_token_hash = ?, email_verified_at = ?
    where id = ?`,
    row.email,
    row.grownup,
    row.holiday,
    row.approvedAt,
    row.verifyHash,
    row.verifiedAt,
    row.id,
  );
}

export async function markVerified(sql: Sql, id: string, at: string): Promise<void> {
  await sql.run(
    "update households set email_verified_at = ?, verify_token_hash = null where id = ?",
    at,
    id,
  );
}

export async function clearSetupToken(sql: Sql, id: string): Promise<void> {
  await sql.run("update households set setup_token_hash = null where id = ?", id);
}

export async function insertKid(
  sql: Sql,
  row: { id: string; householdId: string; name: string; age: number; createdAt: string },
): Promise<void> {
  await sql.run(
    "insert into kids (id, household_id, first_name, age, created_at) values (?, ?, ?, ?, ?)",
    row.id,
    row.householdId,
    row.name,
    row.age,
    row.createdAt,
  );
}

export async function kidsForHousehold(sql: Sql, householdId: string): Promise<Kid[]> {
  return sql.all<Kid>("select * from kids where household_id = ? order by created_at", householdId);
}

export async function kidById(sql: Sql, id: string): Promise<Kid | undefined> {
  return sql.get<Kid>("select * from kids where id = ?", id);
}

export async function kidByUidHash(sql: Sql, hash: string): Promise<Kid | undefined> {
  return sql.get<Kid>("select * from kids where uid_hash = ?", hash);
}

export async function insertPairing(
  sql: Sql,
  row: { id: string; deviceId: string; kidId: string; expiresAt: string },
): Promise<void> {
  await sql.run(
    "insert into pairings (id, device_id, kid_id, expires_at) values (?, ?, ?, ?)",
    row.id,
    row.deviceId,
    row.kidId,
    row.expiresAt,
  );
}

export async function openPairing(sql: Sql, deviceId: string, now: Date): Promise<Pairing | undefined> {
  return sql.get<Pairing>(
    `select * from pairings
     where device_id = ? and used_at is null
     order by expires_at desc limit 1`,
    deviceId,
  );
}

export async function latestPairingForKid(sql: Sql, kidId: string): Promise<Pairing | undefined> {
  return sql.get<Pairing>(
    "select * from pairings where kid_id = ? order by expires_at desc limit 1",
    kidId,
  );
}

export async function markPairingUsed(sql: Sql, id: string, at: string): Promise<void> {
  await sql.run("update pairings set used_at = ? where id = ? and used_at is null", at, id);
}

export async function bindWand(sql: Sql, kidId: string, hash: string, at: string): Promise<void> {
  await sql.run(
    "update kids set uid_hash = ?, status = 'active', paired_at = ? where id = ? and uid_hash is null",
    hash,
    at,
    kidId,
  );
}
