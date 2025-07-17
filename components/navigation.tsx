"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, Wallet } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { User } from '@supabase/supabase-js'

export function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ name?: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        supabase.from('profiles').select('name').eq('id', data.session.user.id).single().then(({ data }) => {
          setProfile(data)
        })
      } else {
        setProfile(null)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('name').eq('id', session.user.id).single().then(({ data }) => {
          setProfile(data)
        })
      } else {
        setProfile(null)
      }
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Check your email for a magic link!")
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Good Neighbor</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/browse" className="transition-colors hover:text-foreground/80 text-foreground">
              Browse
            </Link>
            <Link href="/sell" className="transition-colors hover:text-foreground/80 text-foreground">
              Post
            </Link>
            <Link href="/profile" className="transition-colors hover:text-foreground/80 text-foreground">
              Profile
            </Link>
            <Link href="/messages" className="transition-colors hover:text-foreground/80 text-foreground">
              Messages
            </Link>
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <nav className="grid gap-6 px-2 py-6">
              <Link href="/browse" className="hover:text-foreground/80">
                Browse
              </Link>
              <Link href="/sell" className="hover:text-foreground/80">
                Post
              </Link>
              <Link href="/profile" className="hover:text-foreground/80">
                Profile
              </Link>
              <Link href="/messages" className="hover:text-foreground/80">
                Messages
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search resources..." className="pl-8 md:w-[300px] lg:w-[400px]" />
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{profile?.name || user.email}</span>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button variant="outline" className="ml-auto hidden md:flex">
                <Wallet className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in with your school email</DialogTitle>
          </DialogHeader>
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-input bg-white text-black hover:bg-gray-100 mb-4"
            onClick={async () => {
              setLoading(true);
              setMessage("");
              const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
              if (error) setMessage(error.message);
              setLoading(false);
            }}
            disabled={loading}
          >
            <span style={{ fontSize: 18 }}>🔵</span> {/* Google icon placeholder */}
            Continue with Google
          </Button>
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
            {message && <div className="text-sm text-center text-muted-foreground">{message}</div>}
          </form>
        </DialogContent>
      </Dialog>
    </header>
  )
}
