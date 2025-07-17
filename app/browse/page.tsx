"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const categories = [
  "Textbooks",
  "Calculators",
  "Uniforms",
  "Backpacks",
  "Sports Gear",
  "Trip Supplies",
  "Other"
]
const schools = [
  "The Hockaday School",
  "St. Mark's School of Texas"
]
const conditions = ["New", "Like New", "Used", "Damaged"]

export default function BrowsePage() {
  const [listings, setListings] = useState<any[]>([])
  const [category, setCategory] = useState("all")
  const [school, setSchool] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      let query = supabase.from("listings").select("*")
      if (category !== "all") query = query.eq("category", category)
      if (school !== "all") query = query.eq("school", school)
      if (search) query = query.ilike("title", `%${search}%`)
      const { data, error } = await query.order("created_at", { ascending: false })
      if (!error && data) {
        setListings(data)
      }
      setLoading(false)
    }
    fetchListings()

    // Subscribe to real-time inserts and re-fetch all listings
    const channel = supabase
      .channel('public:listings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, () => {
        fetchListings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [category, school, search])

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">School</label>
                <Select value={school} onValueChange={setSchool}>
                  <SelectTrigger>
                    <SelectValue placeholder="All schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {schools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <Input placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
              <Button onClick={() => {}}>Search</Button>
            </div>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No listings found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <Card key={listing.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start gap-2">
                        <span>{listing.title}</span>
                        <Badge variant="secondary">{listing.category}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{listing.description}</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Condition:</span>
                        <Badge>{listing.condition}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">School: {listing.school}</p>
                      <p className="text-xs text-muted-foreground mt-2">Seller: {listing.seller_name || "Unknown"}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <span className="text-lg font-bold">${listing.price.toFixed(2)}</span>
                      <Button onClick={() => router.push(`/browse/${listing.id}`)}>View Details</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
