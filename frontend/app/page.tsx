"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "@/components/login-screen"
import { StudentPortal } from "@/components/student-portal"
import { AdminPortal } from "@/components/admin-portal"
import { JudgePortal } from "@/components/judge-portal"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

export type UserRole = "student" | "admin" | "judge" | null

export type Event = {
  id: string
  name: string
  category: string
  day: number
  time: string
  venue: string
  status?: string
}

export default function FestCommand() {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events")
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (err) {
      console.error("Failed to fetch events", err)
    }
  }

  useEffect(() => {
    if (userRole) {
      fetchEvents()
    }
  }, [userRole])

  const handleLogin = (role: UserRole, referenceId?: string) => {
    setUserRole(role)
    if (referenceId) {
      setUserId(referenceId)
    }
  }

  const handleLogout = () => {
    setUserRole(null)
    setUserId(null)
  }

  if (!userRole) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <Toaster 
          position="top-right" 
          richColors 
          toastOptions={{
            classNames: {
              error: 'bg-white text-red-600 border-red-200 font-bold',
              success: 'bg-white text-green-600 border-green-200 font-bold',
            },
          }} 
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userRole={userRole} onLogout={handleLogout} />
      <main className="pt-16">
        {userRole === "student" && <StudentPortal events={events} studentId={userId} />}
        {userRole === "admin" && <AdminPortal events={events} fetchEvents={fetchEvents} />}
        {userRole === "judge" && <JudgePortal judgeId={userId} />}
      </main>
      <Toaster position="top-right" theme="light" richColors />
    </div>
  )
}
