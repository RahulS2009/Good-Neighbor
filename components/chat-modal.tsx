"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ChatModal({ open, onOpenChange, listingId, sellerId, currentUserId, sellerName, listingOwnerId }: { open: boolean, onOpenChange: (v: boolean) => void, listingId: string, sellerId: string, currentUserId: string, sellerName: string, listingOwnerId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)

  // Determine the other user in the conversation
  const otherUserId = currentUserId === sellerId ? listingOwnerId : sellerId

  useEffect(() => {
    if (!open) return
    const fetchMessages = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("listing_id", listingId)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: true })
      setMessages(data || [])
      setLoading(false)
    }
    fetchMessages()
    // Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `listing_id=eq.${listingId}` }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, listingId, currentUserId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Create a temporary optimistic message
    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      listing_id: listingId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Send to Supabase
    const { data, error } = await supabase.from("messages").insert({
      listing_id: listingId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: newMessage.trim(),
    }).select().single();

    // Replace the optimistic message with the real one
    if (data) {
      setMessages(prev => prev.map(msg => (msg.id === optimisticMsg.id ? data : msg)));
    }
    setNewMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat with {sellerName}</DialogTitle>
        </DialogHeader>
        <div className="h-64 overflow-y-auto border rounded p-2 bg-muted mb-2 flex flex-col gap-2">
          {loading ? (
            <div>Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-muted-foreground text-center">No messages yet.</div>
          ) : (
            [...new Map(messages.map(msg => [msg.id, msg])).values()].map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded px-3 py-1 max-w-xs break-words ${msg.sender_id === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." />
          <Button type="submit">Send</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 