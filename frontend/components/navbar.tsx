"use client"

import { Button } from "@/components/ui/button"
import { Zap, LogOut, GraduationCap, Users, Award } from "lucide-react"
import type { UserRole } from "@/app/page"

interface NavbarProps {
  userRole: UserRole
  onLogout: () => void
}

export function Navbar({ userRole, onLogout }: NavbarProps) {
  const roleConfig = {
    student: {
      label: "Student Portal",
      icon: GraduationCap,
      color: "text-[#0D9488]",
    },
    admin: {
      label: "Admin Portal",
      icon: Users,
      color: "text-[#4A7C59]",
    },
    judge: {
      label: "Judge Portal",
      icon: Award,
      color: "text-[#C2410C]",
    },
  }

  const config = userRole ? roleConfig[userRole] : null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#FFFFFF] border-b-[3px] border-[#1C1A14]">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-none bg-[#F5E642]">
              <Zap className="h-5 w-5 text-[#1C1A14]" />
            </div>
            <span className="text-2xl font-anton tracking-wide">
              <span className="text-[#1C1A14]">Fest</span>
              <span className="text-[#FF5C3A]">Command</span>
            </span>
          </div>

          {config && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#F5F2EC] border-[1.5px] border-[#D9D3C8]">
              <config.icon className={`h-4 w-4 ${config.color}`} />
              <span className="text-sm font-mono text-[#1C1A14]">{config.label}</span>
            </div>
          )}
        </div>

        <Button
          onClick={onLogout}
          className="btn-secondary font-mono text-sm px-4 py-2"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  )
}
