import { NextResponse } from 'next/server';

export const apiResponse = {
  success: <T = unknown>(message: string, data?: T, status: number = 200) => {
    return NextResponse.json(
      { success: true, message, data },
      { status }
    );
  },
  
  error: <E = unknown>(message: string, status: number = 500, errors?: E) => {
    return NextResponse.json(
      { success: false, message, errors },
      { status }
    );
  },
  
  validationError: <E = unknown>(message: string = 'Validation Error', errors?: E) => {
    return NextResponse.json(
      { success: false, message, errors },
      { status: 400 }
    );
  },
  
  unauthorized: (message: string = 'Unauthorized') => {
    return NextResponse.json(
      { success: false, message },
      { status: 401 }
    );
  },
  
  forbidden: (message: string = 'Forbidden') => {
    return NextResponse.json(
      { success: false, message },
      { status: 403 }
    );
  },
  
  notFound: (message: string = 'Resource not found') => {
    return NextResponse.json(
      { success: false, message },
      { status: 404 }
    );
  }
};
