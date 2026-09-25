// NextAuth type extensions
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    teamId: string | null;
    teamName: string | null;
    teamColor: string | null;
    personalPoints: number;
    avatarFrame: string;
    title: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      teamId: string | null;
      teamName: string | null;
      teamColor: string | null;
      personalPoints: number;
      avatarFrame: string;
      title: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    teamId: string | null;
    teamName: string | null;
    teamColor: string | null;
    personalPoints: number;
    avatarFrame: string;
    title: string | null;
  }
}
