import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const { db } = await import('./db')
          const user = await db.user.findUnique({ where: { email: credentials.email } })
          if (!user) return null
          const ok = await bcrypt.compare(credentials.password, user.password)
          if (!ok) return null
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        } catch (e) {
          console.error('Auth error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) { token.id = user.id; token.role = user.role }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) { session.user.id = token.id; session.user.role = token.role }
      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
