import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import getDb from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const db = getDb();
        const user = db.prepare(`
          SELECT u.*, t.name as team_name, t.color as team_color
          FROM users u
          LEFT JOIN teams t ON u.team_id = t.id
          WHERE u.username = ?
        `).get(credentials.username) as any;

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.display_name,
          email: user.username,
          image: user.avatar_url,
          role: user.role,
          teamId: user.team_id ? String(user.team_id) : null,
          teamName: user.team_name || null,
          teamColor: user.team_color || null,
          personalPoints: user.personal_points,
          avatarFrame: user.avatar_frame,
          title: user.title,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.teamId = (user as any).teamId;
        token.teamName = (user as any).teamName;
        token.teamColor = (user as any).teamColor;
        token.personalPoints = (user as any).personalPoints;
        token.avatarFrame = (user as any).avatarFrame;
        token.title = (user as any).title;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.teamId = token.teamId as string | null;
        session.user.teamName = token.teamName as string | null;
        session.user.teamColor = token.teamColor as string | null;
        session.user.personalPoints = token.personalPoints as number;
        session.user.avatarFrame = token.avatarFrame as string;
        session.user.title = token.title as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'man-coi-secret-key-2024',
};
