export {};

// Define types for the data we pass back and forth
interface User {
  id: string;
  name: string;
  email: string;
  role: "employee" | "admin";
}

interface Employee {
  id: string;
  name: string;
  email: string;
  attended: boolean;
}

interface DashboardStats {
  hadir: number;
  tidakHadir: number;
}

interface ApiResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

declare global {
  interface Window {
    electronAPI: {
      login: (email: string) => Promise<ApiResponse>;
      registerUser: (data: {
        name: string;
        email: string;
        embeddings: number[][];
      }) => Promise<ApiResponse>;
      checkIn: (data: {
        embeddings: number[];
      }) => Promise<ApiResponse>;
      getAdminData: () => Promise<Employee[]>;
      getDashboardData: (userId: string) => Promise<DashboardStats>;
    };
  }
}