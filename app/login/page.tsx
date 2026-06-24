'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) {
      router.push('/')
    } else {
      setError('Email o password non corretti.')
    }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 500, color: '#2c2825', marginBottom: 4 }}>
          ICG Gallery Tools
        </div>
        <div style={{ fontSize: 10, color: '#8a7d70', marginBottom: 28, textTransform: 'uppercase', letterSpacing: '.07em' }}>
          Samples Management Platform
        </div>
        {error && <div className="alert alert-err" style={{ marginBottom: 14 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Email aziendale</label>
          <input className="form-control" type="email" placeholder="nome@icg.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Accesso in corso…' : 'Accedi'}
        </button>
        <div style={{ marginTop: 20, padding: '10px 12px', background: '#f9f8f6', borderRadius: 7, fontSize: 10, color: '#8a7d70', lineHeight: 1.9 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Account demo:</div>
          <div>admin@icg.com / admin123</div>
          <div>ricco@icg.com / icg2026</div>
          <div>viewer@icg.com / viewer123</div>
        </div>
      </div>
    </div>
  )
}