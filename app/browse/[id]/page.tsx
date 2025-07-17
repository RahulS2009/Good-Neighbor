"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import ChatModal from "@/components/chat-modal"

export default function ListingDetailsPage() {
  const { id } = useParams() as { id: string }
  const [listing, setListing] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      const { data: listingData } = await supabase.from("listings").select("*").eq("id", id).single()
      setListing(listingData)
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!listing) return <div className="min-h-screen flex items-center justify-center">Listing not found.</div>

  const listingOwnerId = listing?.user_id

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{listing.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="mb-2"><span className="font-semibold">Description:</span> {listing.description}</div>
                  <div className="mb-2"><span className="font-semibold">Price:</span> ${listing.price.toFixed(2)}</div>
                  <div className="mb-2"><span className="font-semibold">Category:</span> {listing.category}</div>
                  <div className="mb-2"><span className="font-semibold">Condition:</span> {listing.condition}</div>
                  <div className="mb-2"><span className="font-semibold">School:</span> {listing.school}</div>
                  <div className="mb-2"><span className="font-semibold">Seller:</span> {listing.seller_name || "Unknown"}</div>
                </div>
                {/* Image */}
                {listing.image_url && (
                  <div className="w-full md:w-80 flex-shrink-0 flex justify-center">
                    <img
                      src={listing.image_url}
                      alt="Listing"
                      className="rounded max-h-80 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {user && user.id !== listing.user_id && (
                <Button onClick={() => setShowChat(true)}>Message Seller</Button>
              )}
            </CardFooter>
          </Card>
          {user && (
            <ChatModal
              open={showChat}
              onOpenChange={setShowChat}
              listingId={listing.id}
              sellerId={listing.user_id}
              currentUserId={user.id}
              sellerName={listing.seller_name || "Seller"}
              listingOwnerId={listingOwnerId}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
} 