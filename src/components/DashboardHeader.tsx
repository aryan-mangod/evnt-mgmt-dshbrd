import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { AuthButtons } from "@/components/AuthButtons"
import { useAuth } from "@/components/AuthProvider"
import { useMsal } from "@azure/msal-react"

export function DashboardHeader() {
  const { user, userRole } = useAuth()
  const { accounts } = useMsal()
  
  const displayName = user?.name || user?.username || userRole || 'User'
  const userEmail = user?.username || ''
  const initials = (displayName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'U'
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:bg-zinc-900/95 dark:supports-[backdrop-filter]:bg-zinc-900/90">
      <div className="flex h-16 items-center justify-between px-6 max-w-none">
        <div className="flex items-center gap-4 min-w-0">
          <SidebarTrigger className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100 transition-opacity" />
          <div className="hidden md:flex min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">
              MS Innovation Event Management
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}