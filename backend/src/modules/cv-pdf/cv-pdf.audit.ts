import { AuditAction, type Prisma } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";
import { CV_AUDIT_ENTITY, CV_AUDIT_ENTITIES, type CvSection } from "./cv-pdf.constants.js";

export type CvAuditAction = "CREATE" | "UPDATE" | "DELETE";

export type CvAuditRecordInput = {
  userId: number;
  section: CvSection;
  action: CvAuditAction;
  entityId?: number | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Normalizes arbitrary (possibly Date-bearing) values into Prisma JSON input. */
const toJson = (value: unknown): Prisma.InputJsonValue | undefined =>
  value === undefined ? undefined : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);

/**
 * Records CV-affecting mutations into the generic audit_logs table.
 * The monotonically increasing id doubles as the "stale CV" marker: a stored
 * CV version is considered fresh when `cv_versions.last_audit_id` >= latest id.
 */
export const cvAudit = {
  async record(input: CvAuditRecordInput): Promise<number> {
    const row = await prisma.audit_logs.create({
      data: {
        user_id: input.userId,
        action: AuditAction[input.action],
        entity: CV_AUDIT_ENTITY[input.section],
        entity_id: input.entityId ?? null,
        old_values: toJson(input.oldValues),
        new_values: toJson(input.newValues),
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
      },
      select: { id: true },
    });
    return row.id;
  },

  /** Highest audit id for any CV section belonging to the user (0 if none). */
  async latestId(userId: number): Promise<number> {
    const row = await prisma.audit_logs.findFirst({
      where: { user_id: userId, entity: { in: CV_AUDIT_ENTITIES as string[] } },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    return row?.id ?? 0;
  },
};
