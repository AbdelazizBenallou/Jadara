import type { Request } from "express";

interface PaginationQuery {
  page?: string;
  limit?: string;
  cursor?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface CursorPaginationParams {
  cursor: number | null;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor: number | null;
}

export const pagination = {
  getOffsetParams(req: Request): PaginationParams {
    const query = req.query as PaginationQuery;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  },

  getCursorParams(req: Request, defaultLimit = 20): CursorPaginationParams {
    const query = req.query as PaginationQuery;
    const cursor = query.cursor ? parseInt(query.cursor, 10) : null;
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || String(defaultLimit), 10)));
    const skip = cursor ? 1 : 0;
    return { cursor, limit, skip };
  },

  buildMeta(total: number, page: number, limit: number): PaginationMeta {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      nextCursor: null,
    };
  },

  buildCursorMeta(
    total: number,
    lastItem: { [key: string]: number } | null,
    limit: number,
  ): PaginationMeta {
    return {
      total,
      page: 1,
      limit,
      totalPages: Math.ceil(total / limit),
      nextCursor: lastItem ? lastItem.id : null,
    };
  },
};
