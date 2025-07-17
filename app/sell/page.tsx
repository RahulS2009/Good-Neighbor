"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

export default function SellPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState(categories[0])
  const [condition, setCondition] = useState(conditions[0])
  const [school, setSchool] = useState(schools[0])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (!data.user) {
        setShowAuthDialog(true)
        setTimeout(() => {
          router.replace("/auth")
        }, 2000)
      }
    })
  }, [])

  const getSellerName = () => {
    return user?.user_metadata?.name || user?.email || "Unknown"
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    let image_url = null
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { data: storageData, error: storageError } = await supabase.storage.from("listing-images").upload(fileName, imageFile)
      if (storageError) {
        setError("Image upload failed: " + storageError.message)
        setLoading(false)
        return
      }
      image_url = supabase.storage.from("listing-images").getPublicUrl(fileName).data.publicUrl
    }
    const { error: insertError } = await supabase.from("listings").insert({
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      school,
      image_url,
      user_id: user.id,
      seller_name: getSellerName()
    })
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }
    setLoading(false)
    router.push("/browse")
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <Dialog open={showAuthDialog}>
          <DialogContent className="max-w-md text-center">
            <DialogHeader>
              <DialogTitle>You must be signed in to post a listing</DialogTitle>
            </DialogHeader>
            <div className="mb-4">Please sign in or create an account to continue.</div>
            <Button onClick={() => router.replace("/auth")}>Go to Sign In</Button>
          </DialogContent>
        </Dialog>
        <Footer />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Post a New Listing</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Price (USD)</label>
                  <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Condition</label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">School</label>
                  <Select value={school} onValueChange={setSchool}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Photo (optional)</label>
                  <Input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 max-h-40 rounded" />}
                </div>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Posting..." : "Post Listing"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
