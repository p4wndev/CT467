import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HomeHero } from "@/components/home-hero"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="m2 2 20 20" />
              <path d="M12 12v8" />
              <path d="M12 12h8" />
              <path d="M12 12V4" />
              <path d="M12 12H4" />
            </svg>
            <span className="text-xl font-bold">CinemaSystem</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Register</Button>
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <HomeHero />
      </main>
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 Cinema Management System. All rights reserved.</p>
      </footer>
    </div>
  )
}
