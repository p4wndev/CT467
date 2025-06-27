import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HomeHero() {
  return (
    <section className="container mx-auto px-4 py-24 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Cinema Management System</h1>
        <p className="mb-10 text-lg text-gray-600 dark:text-gray-400">
          A comprehensive solution for managing cinema operations, from ticket sales to showtime scheduling.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/auth/login">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-16 flex justify-center">
        <div className="relative h-[300px] w-full max-w-3xl overflow-hidden rounded-xl bg-gray-900 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-4 p-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video rounded-md bg-gray-800 p-4 shadow-md">
                  <div className="h-full w-full rounded bg-gray-700 opacity-50"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white">
            <p className="text-sm font-medium">Streamlined cinema management interface</p>
          </div>
        </div>
      </div>
    </section>
  )
}
