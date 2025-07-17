"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"

const roles = ["Student", "Parent", "Teacher", "Admin"]
const schools = ["The Hockaday School", "St. Mark's School of Texas"]

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [role, setRole] = useState(roles[0])
  const [school, setSchool] = useState(schools[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfileAndListings = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      // If profile is missing, upsert it using user metadata
      if (!profileData) {
        const newProfile = {
          id: user.id,
          name: user.user_metadata?.name || "",
          email: user.email,
          role: user.user_metadata?.role || roles[0],
          school: user.user_metadata?.school || schools[0],
        }
        await supabase.from("profiles").upsert(newProfile)
        profileData = newProfile
      }
      setProfile(profileData)
      setName(profileData?.name || user.user_metadata?.name || "")
      setRole(profileData?.role || user.user_metadata?.role || roles[0])
      setSchool(profileData?.school || user.user_metadata?.school || schools[0])
      const { data: listingsData } = await supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      setListings(listingsData || [])
      setLoading(false)
    }
    fetchProfileAndListings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: updateError } = await supabase.from("profiles").update({ name, role, school }).eq("id", user.id)
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }
    // Re-fetch profile after save
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading...</div>
              ) : editing ? (
                <form className="space-y-4" onSubmit={handleSave}>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">School</label>
                    <Select value={school} onValueChange={setSchool}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                  <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                  <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setEditing(false)}>Cancel</Button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div><span className="font-semibold">Name:</span> {profile?.name || "Not set"}</div>
                  <div><span className="font-semibold">Email:</span> {profile?.email || "Not set"}</div>
                  <div><span className="font-semibold">Role:</span> {profile?.role || "Not set"}</div>
                  <div><span className="font-semibold">School:</span> {profile?.school || "Not set"}</div>
                  <Button className="mt-4" onClick={() => setEditing(true)}>Edit Profile</Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My Listings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading...</div>
              ) : listings.length === 0 ? (
                <div className="text-muted-foreground">You have not posted any listings yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listings.map(listing => (
                    <Card key={listing.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start gap-2">
                          <span>{listing.title}</span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{listing.description}</p>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Condition:</span>
                          <span>{listing.condition}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Category: {listing.category}</div>
                        <div className="text-xs text-muted-foreground">School: {listing.school}</div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <span className="text-lg font-bold">${listing.price.toFixed(2)}</span>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
