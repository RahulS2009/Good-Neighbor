"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const roles = ["Student", "Parent", "Teacher", "Admin"]

const schools = [
  "The Hockaday School",
  "St. Mark's School of Texas"
]

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState(roles[0])
  const [school, setSchool] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [verificationSent, setVerificationSent] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setVerificationSent(false)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, school },
        emailRedirectTo: window.location.origin + "/auth"
      },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    // Always upsert full profile info
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name,
        email,
        role,
        school,
      })
    }
    setLoading(false)
    setVerificationSent(true)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    // Check if email is confirmed
    const user = data.user
    if (user && !user.email_confirmed_at) {
      setError("Please verify your email before signing in. Check your inbox.")
      setLoading(false)
      return
    }
    setLoading(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl bg-white/90 dark:bg-background/90">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-center text-2xl font-bold mt-4">
            {mode === "signin" ? "Sign In to Good Neighbor" : "Sign Up for Good Neighbor"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white text-black border border-input shadow-md hover:bg-gray-50 py-3 text-lg font-semibold rounded-lg mb-6"
            style={{ minHeight: 56 }}
            onClick={async () => {
              setLoading(true);
              setError("");
              const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
              if (error) setError(error.message);
              setLoading(false);
            }}
            disabled={loading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_17_40)">
                <path d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.451h6.484a5.54 5.54 0 01-2.4 3.632v3.017h3.877c2.27-2.09 3.565-5.17 3.565-8.744z" fill="#4285F4"/>
                <path d="M12.24 24c3.24 0 5.963-1.07 7.95-2.91l-3.877-3.017c-1.08.726-2.46 1.16-4.073 1.16-3.13 0-5.78-2.11-6.73-4.946H1.53v3.09A11.997 11.997 0 0012.24 24z" fill="#34A853"/>
                <path d="M5.51 14.287a7.19 7.19 0 010-4.574V6.623H1.53a12.002 12.002 0 000 10.754l3.98-3.09z" fill="#FBBC05"/>
                <path d="M12.24 4.77c1.76 0 3.34.605 4.59 1.793l3.43-3.43C18.2 1.07 15.48 0 12.24 0A11.997 11.997 0 001.53 6.623l3.98 3.09c.95-2.836 3.6-4.946 6.73-4.946z" fill="#EA4335"/>
              </g>
              <defs>
                <clipPath id="clip0_17_40">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            Continue with Google
          </Button>
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-muted-foreground/20" />
            <span className="mx-4 text-muted-foreground text-xs uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-muted-foreground/20" />
          </div>
          {verificationSent ? (
            <div className="text-center text-green-600">
              Check your email to verify your account before signing in.
            </div>
          ) : (
          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select className="w-full border rounded-md px-3 py-2" value={role} onChange={e => setRole(e.target.value)}>
                    {roles.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">School</label>
                  <select className="w-full border rounded-md px-3 py-2" value={school} onChange={e => setSchool(e.target.value)} required>
                    <option value="">Select a school</option>
                    {schools.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full py-3 text-base font-semibold rounded-lg" disabled={loading}>
              {loading ? (mode === "signin" ? "Signing In..." : "Signing Up...") : (mode === "signin" ? "Sign In" : "Sign Up")}
            </Button>
          </form>
          )}
          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{' '}
                <button className="text-primary underline" onClick={() => setMode("signup")}>Sign Up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className="text-primary underline" onClick={() => setMode("signin")}>Sign In</button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 