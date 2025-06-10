// auth.d.ts
declare module "#auth-utils" {
  interface User {
    login: string;
    id: string;
    name: string;
    email: string;
  }

  interface UserSession {
    // Add your own fields
  }

  interface SecureSessionData {
    // Add your own fields
  }
}

export {};
