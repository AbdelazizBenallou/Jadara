import type { Response } from "express";

interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

interface ErrorResponse {
  success: false;
  message: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor: number | null;
}

interface PaginatedResponse<T = unknown> {
  success: true;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

const send = <T>(
  res: Response,
  statusCode: number,
  body: SuccessResponse<T> | ErrorResponse | PaginatedResponse<T>,
): void => {
  res.status(statusCode).json(body);
};

export const response = {
  success: <T>(res: Response, data: T, message = "Success", statusCode = 200): void => {
    send<T>(res, statusCode, { success: true, message, data });
  },

  error: (res: Response, message = "Something went wrong", statusCode = 500): void => {
    send(res, statusCode, { success: false, message });
  },

  paginated: <T>(res: Response, data: T[], meta: PaginationMeta, message = "Success"): void => {
    send<T[]>(res, 200, { success: true, message, data, meta });
  },
};
