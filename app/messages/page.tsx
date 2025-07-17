"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ChatModal from "@/components/chat-modal"

function groupConversations(messages, userId) {
  // Group by listing and other user
  const map = new Map()
  messages.forEach(msg => {
    const otherUser = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
    const key = `${msg.listing_id}|${otherUser}`
    if (!map.has(key)) {
      map.set(key, { listing_id: msg.listing_id, other_user_id: otherUser, last_message: msg, messages: [msg] })
    } else {
      const convo = map.get(key)
      convo.messages.push(msg)
      if (msg.created_at > convo.last_message.created_at) convo.last_message = msg
    }
  })
  return Array.from(map.values())
}

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [listingsMap, setListingsMap] = useState<Record<string, any>>({})
  const [otherUsersMap, setOtherUsersMap] = useState<Record<string, any>>({})
  const [selectedConvo, setSelectedConvo] = useState<any>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      if (!currentUser) return
      const { data: messages } = await supabase.from("messages").select("*").or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      const convos = groupConversations(messages || [], currentUser.id)
      setConversations(convos)
      // Fetch listings and users for display
      const listingIds = Array.from(new Set(convos.map(c => c.listing_id)))
      const userIds = Array.from(new Set(convos.map(c => c.other_user_id)))
      const { data: listings } = await supabase.from("listings").select("id, title, seller_name").in("id", listingIds)
      const { data: users } = await supabase.from("profiles").select("id, name, email").in("id", userIds)
      const listingsMap: Record<string, any> = {}
      listings?.forEach(l => { listingsMap[l.id] = l })
      setListingsMap(listingsMap)
      const usersMap: Record<string, any> = {}
      users?.forEach(u => { usersMap[u.id] = u })
      setOtherUsersMap(usersMap)
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-muted-foreground text-center">No conversations yet.</div>
              ) : (
                <div className="space-y-4">
                  {conversations.map(convo => (
                    <div key={convo.listing_id + '|' + convo.other_user_id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="font-semibold">{listingsMap[convo.listing_id]?.title || "Listing"}</div>
                        <div className="text-xs text-muted-foreground">With: {otherUsersMap[convo.other_user_id]?.name || otherUsersMap[convo.other_user_id]?.email || "User"}</div>
                        <div className="text-xs text-muted-foreground">Last: {convo.last_message.content}</div>
                      </div>
                      <Button size="sm" onClick={() => { setSelectedConvo(convo); setShowChat(true); }}>Open Chat</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {selectedConvo && user && (
            <ChatModal
              open={showChat}
              onOpenChange={v => { setShowChat(v); if (!v) setSelectedConvo(null); }}
              listingId={selectedConvo.listing_id}
              sellerId={listingsMap[selectedConvo.listing_id]?.user_id || selectedConvo.other_user_id}
              currentUserId={user.id}
              sellerName={listingsMap[selectedConvo.listing_id]?.seller_name || "Seller"}
              listingOwnerId={listingsMap[selectedConvo.listing_id]?.user_id || selectedConvo.other_user_id}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
} 