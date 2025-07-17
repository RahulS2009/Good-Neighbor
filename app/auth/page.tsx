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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {mode === "signin" ? "Sign In to Good Neighbor" : "Sign Up for Good Neighbor"}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <Button type="submit" className="w-full" disabled={loading}>
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