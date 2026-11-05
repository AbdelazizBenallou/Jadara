export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor: number | null;
}

export type PaginatedEnvelope<T> = ApiEnvelope<T[]> & {
  meta?: PaginationMeta;
};

export interface PaginatedResult<T> {
  items: T[];
  meta?: PaginationMeta;
}

export type RequestBody = object | undefined;
