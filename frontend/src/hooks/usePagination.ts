import { useState, useMemo, useCallback } from "react";

interface UsePaginationOptions {
  pageSize?: number;
}

interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetPage: () => void;
}

export function usePagination(
  options: UsePaginationOptions = {},
): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(options.pageSize ?? 20);

  const offset = useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize],
  );

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return { currentPage, pageSize, offset, setPage, setPageSize, resetPage };
}
