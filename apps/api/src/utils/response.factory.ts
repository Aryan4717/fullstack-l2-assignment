export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ResponseFactory {
  static success<T>(data: T, message = 'Success', statusCode = 200): { status: number; body: ApiResponse<T> } {
    return {
      status: statusCode,
      body: { success: true, message, data },
    };
  }

  static created<T>(data: T, message = 'Created'): { status: number; body: ApiResponse<T> } {
    return {
      status: 201,
      body: { success: true, message, data },
    };
  }

  static error(message: string, statusCode: number, error?: string): { status: number; body: ApiResponse<never> } {
    return {
      status: statusCode,
      body: { success: false, message, error },
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
  ): { status: number; body: PaginatedResponse<T> } {
    return {
      status: 200,
      body: {
        success: true,
        message,
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}
