// API xato modeli
export interface ApiError {
  status: number;
  code: string;
  message: string;
}

// Sahifalangan javob
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
