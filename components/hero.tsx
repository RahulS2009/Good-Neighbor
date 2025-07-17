import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950" />
      <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Give, Find, and Request Free School Resources in DFW
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            A peer-to-peer platform for students and families at private schools in Dallas–Fort Worth to share textbooks, supplies, and more.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/browse">
              <Button size="lg" className="rounded-full">
                Browse Free Resources
              </Button>
            </Link>
            <Link href="/sell">
              <Button size="lg" variant="outline" className="rounded-full">
                Post a Listing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
