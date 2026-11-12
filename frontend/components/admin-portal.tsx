"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  LayoutDashboard,
  CalendarCog,
  Users,
  TrendingUp,
  Calendar,
  Gavel,
  Pencil,
  Trash2,
  Plus,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import type { Event } from "@/app/page"

interface AdminPortalProps {
  events: Event[]
  fetchEvents: () => void
}

type SidebarView = "dashboard" | "events" | "participants"

export function AdminPortal({ events, fetchEvents }: AdminPortalProps) {
  const [activeView, setActiveView] = useState<SidebarView>("dashboard")
  const [searchQuery, setSearchQuery] = useState("")

  // Event state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    name: "",
    category: "Tech",
    day: "1",
    time: "",
    venue: "",
  })

  // Participant state
  const [participants, setParticipants] = useState<any[]>([])
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    username: "",
    password: "",
    name: "",
    college: "",
  })

  // PL/SQL Enrollment Checker state
  const [checkStudentId, setCheckStudentId] = useState('')
  const [adminModal, setAdminModal] = useState({ isOpen: false, message: '', isError: false })

  // Dashboard live stats
  const [dashboardStats, setDashboardStats] = useState({
    totalRegistrations: 0,
    activeEvents: 0,
    totalJudges: 0,
    recentActivity: [] as { student_name: string; event_name: string }[],
  })

  const fetchParticipants = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/participants")
      if (res.ok) {
        const data = await res.json()
        setParticipants(data)
      }
    } catch (err) {
      console.error("Failed to fetch participants", err)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [])

  // Fetch live dashboard stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard-stats')
        const result = await response.json()
        if (result.success) {
          setDashboardStats(result.data)
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      }
    }
    fetchStats()
  }, [])

  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.college_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ⚡ PL/SQL Function Executor
  const handleCheckEnrollments = async () => {
    if (!checkStudentId.trim()) {
      setAdminModal({ isOpen: true, message: 'Please enter a Student ID to check.', isError: true });
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/check-enrollments/${checkStudentId.trim()}`);
      const data = await response.json();

      if (data.success) {
        setAdminModal({
          isOpen: true,
          message: `Student ${checkStudentId.toUpperCase()} is currently enrolled in ${data.count} events.`,
          isError: false,
        });
        setCheckStudentId('');
      } else {
        setAdminModal({ isOpen: true, message: data.message || 'Database function returned an error.', isError: true });
      }
    } catch (error) {
      console.error('Error:', error);
      setAdminModal({ isOpen: true, message: 'Failed to connect to the server.', isError: true });
    }
  };

  const handleCreateEvent = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      })
      if (res.ok) {
        toast.success("Event created successfully!", {
          description: `${newEvent.name} has been added to the schedule.`,
        })
        setIsCreateDialogOpen(false)
        setNewEvent({ name: "", category: "Tech", day: "1", time: "", venue: "" })
        fetchEvents()
      }
    } catch (err) {
      toast.error("Failed to create event")
    }
  }

  const handleAddParticipant = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newParticipant)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Participant registered successfully!", {
          description: `${newParticipant.name} is now registered.`,
        })
        setIsParticipantDialogOpen(false)
        setNewParticipant({ username: "", password: "", name: "", college: "" })
        fetchParticipants()
      } else {
        toast.error(data.message || "Failed to register participant")
      }
    } catch (err) {
      toast.error("Failed to register participant")
    }
  }

  const handleDelete = async (eventId: string, eventName: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.error(`${eventName} deleted`, {
          description: "Event has been removed from the schedule.",
        })
        fetchEvents()
      }
    } catch (err) {
      toast.error("Failed to delete event")
    }
  }

  const handlePublishResults = async (eventId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/publish-results`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error publishing results:", error);
      toast.error("Failed to publish results.");
    }
  };

  const sidebarItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "events" as const, label: "Event Management", icon: CalendarCog },
    { id: "participants" as const, label: "Participants", icon: Users },
  ]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#FAFAF7]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#F5F2EC] border-r border-[#D9D3C8] flex flex-col shrink-0">
        <div
          className="h-[120px] relative flex items-center justify-center border-b-[2px] border-[#1C1A14]"
          style={{
            backgroundImage: `linear-gradient(rgba(28,26,20,0.7), rgba(28,26,20,0.8)), url('https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <span className="font-anton text-2xl text-[#FFFFFF] tracking-widest">FESTCOMMAND</span>
        </div>
        <nav className="space-y-0 p-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 font-sans border-l-[3px]
                ${activeView === item.id
                  ? "bg-[#1C1A14] text-[#F5E642] font-bold border-l-[#1C1A14]"
                  : "text-[#6B6352] bg-transparent border-l-transparent hover:bg-[#EDE8DF] hover:text-[#1C1A14] hover:border-l-[#FF5C3A]"
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-10 page-animate">
        {activeView === "dashboard" && (
          <div className="space-y-8">
            <div className="border-b-[2px] border-[#1C1A14] pb-4">
              <h1 className="text-[48px] font-anton text-[#1C1A14] uppercase leading-none">Admin Console</h1>
              <p className="text-[#6B6352] font-sans mt-2">Overview of your fest statistics</p>
            </div>

            {/* KPI Cards — Live DB data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Total Registrations */}
              <div className="bg-[#FFFFFF] p-6 border-[2px] border-[#1C1A14] shadow-[4px_4px_0px_#1C1A14] transition-transform hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-[12px] text-[#6B6352] uppercase tracking-wider">Total Enrollments</p>
                    <p className="font-anton text-[40px] text-[#1C1A14] leading-tight">{dashboardStats.totalRegistrations}</p>
                    <div className="flex items-center gap-1 text-sm font-sans font-bold">
                      <TrendingUp className="h-4 w-4 text-[#4A7C59]" />
                      <span className="text-[#4A7C59]">Live DB Count</span>
                    </div>
                  </div>
                  <div className="p-3 border-[2px] border-[#1C1A14] bg-[#1C1A14] text-[#FFFFFF]">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card 2: Total Events */}
              <div className="bg-[#FFFFFF] p-6 border-[2px] border-[#1C1A14] shadow-[4px_4px_0px_#1C1A14] transition-transform hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-[12px] text-[#6B6352] uppercase tracking-wider">Total Events</p>
                    <p className="font-anton text-[40px] text-[#1C1A14] leading-tight">{dashboardStats.activeEvents}</p>
                    <div className="flex items-center gap-1 text-sm font-sans font-bold">
                      <TrendingUp className="h-4 w-4 text-[#4A7C59]" />
                      <span className="text-[#4A7C59]">Live DB Count</span>
                    </div>
                  </div>
                  <div className="p-3 border-[2px] border-[#1C1A14] bg-[#F5E642] text-[#1C1A14]">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card 3: Total Judges */}
              <div className="bg-[#FFFFFF] p-6 border-[2px] border-[#1C1A14] shadow-[4px_4px_0px_#1C1A14] transition-transform hover:-translate-y-1 border-b-[6px] border-b-[#FF5C3A]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-[12px] text-[#6B6352] uppercase tracking-wider">Total Judges</p>
                    <p className="font-anton text-[40px] text-[#1C1A14] leading-tight">{dashboardStats.totalJudges}</p>
                    <div className="flex items-center gap-1 text-sm font-sans font-bold">
                      <span className="text-[#6B6352]">Live DB Count</span>
                    </div>
                  </div>
                  <div className="p-3 border-[2px] border-[#1C1A14] bg-[#FF5C3A] text-[#FFFFFF]">
                    <Gavel className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity — Live Enrollments */}
            <div className="border-[2px] border-[#1C1A14] rounded-none bg-[#FFFFFF] shadow-[4px_4px_0px_#1C1A14]">
              <div className="p-4 border-b-[2px] border-[#1C1A14] bg-[#2D1B4E] flex items-center justify-between">
                <h2 className="font-anton text-xl text-[#FFFFFF] uppercase">Recent Enrollments</h2>
                <span className="font-mono text-[10px] text-[#F5E642] uppercase tracking-widest">LIVE FROM DB</span>
              </div>
              <div className="flex flex-col">
                {dashboardStats.recentActivity.length > 0 ? (
                  dashboardStats.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border-b border-[#D9D3C8] last:border-0 hover:bg-[#FAFAF7]">
                      <span className="font-sans text-[#1C1A14] font-medium">
                        <span className="text-[#FF5C3A] font-bold">{activity.student_name}</span>
                        {" registered for "}
                        <span className="font-bold">{activity.event_name}</span>
                      </span>
                      <span className="font-mono text-xs text-[#6B6352] shrink-0 ml-4">Latest</span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[#6B6352] font-sans">
                    No enrollments found in the database yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "events" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[2px] border-[#1C1A14] pb-4">
              <div>
                <h1 className="text-[48px] font-anton text-[#1C1A14] uppercase leading-none">Event Management</h1>
                <p className="text-[#6B6352] font-sans mt-2">Create and manage fest events</p>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    CREATE EVENT
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#FFFFFF] border-[2px] border-[#1C1A14] rounded-none shadow-[8px_8px_0px_#1C1A14]">
                  <DialogHeader>
                    <DialogTitle className="font-anton text-[28px] uppercase text-[#1C1A14]">Create New Event</DialogTitle>
                    <DialogDescription className="font-sans text-[#6B6352]">Add a new event to the fest schedule</DialogDescription>
                  </DialogHeader>
                  <FieldGroup className="py-4">
                    <Field>
                      <FieldLabel className="font-sans font-bold">Event Name</FieldLabel>
                      <Input
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        placeholder="Enter event name"
                        className="rounded-none border-[2px] border-[#1C1A14]"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel className="font-sans font-bold">Category</FieldLabel>
                        <select
                          value={newEvent.category}
                          onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                          className="w-full h-10 px-3 rounded-none bg-[#FFFFFF] border-[2px] border-[#1C1A14] text-[#1C1A14] font-sans"
                        >
                          <option value="Tech">Tech</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                        </select>
                      </Field>
                      <Field>
                        <FieldLabel className="font-sans font-bold">Day</FieldLabel>
                        <select
                          value={newEvent.day}
                          onChange={(e) => setNewEvent({ ...newEvent, day: e.target.value })}
                          className="w-full h-10 px-3 rounded-none bg-[#FFFFFF] border-[2px] border-[#1C1A14] text-[#1C1A14] font-sans"
                        >
                          <option value="1">Day 1</option>
                          <option value="2">Day 2</option>
                          <option value="3">Day 3</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel className="font-sans font-bold">Time</FieldLabel>
                        <Input
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                          placeholder="e.g., 10:00 AM"
                          className="rounded-none border-[2px] border-[#1C1A14]"
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="font-sans font-bold">Venue</FieldLabel>
                        <Input
                          value={newEvent.venue}
                          onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                          placeholder="Enter venue"
                          className="rounded-none border-[2px] border-[#1C1A14]"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" className="btn-secondary" onClick={() => setIsCreateDialogOpen(false)}>
                      CANCEL
                    </Button>
                    <Button onClick={handleCreateEvent} className="btn-primary">
                      CREATE EVENT
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Events Table */}
            <div className="border-[2px] border-[#1C1A14] bg-[#FFFFFF] shadow-[4px_4px_0px_#1C1A14] overflow-x-auto">
              <table className="editorial-table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Event Name</th>
                    <th className="text-left">Category</th>
                    <th className="text-left">Day</th>
                    <th className="text-left">Time</th>
                    <th className="text-left">Venue</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="font-bold text-[#1C1A14] text-lg">{event.name}</td>
                      <td>
                        <span className={`inline-block px-3 py-1 font-mono text-xs text-[#FFFFFF] badge-${event.category.toLowerCase()}`}>
                          {event.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono text-[#6B6352]">DAY {event.day}</td>
                      <td className="font-mono text-[#6B6352]">{event.time}</td>
                      <td className="font-mono text-[#6B6352]">{event.venue}</td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="px-3 py-1.5 border-[2px] border-[#1C1A14] bg-[#F5E642] text-[#1C1A14] hover:bg-[#1C1A14] hover:text-[#FFFFFF] transition-colors flex items-center font-bold text-xs shadow-[2px_2px_0px_#1C1A14] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            onClick={() => handlePublishResults(event.id)}
                            title="Publish Results"
                          >
                            PUBLISH RESULTS
                          </button>
                          <button
                            className="p-2 border-[2px] border-[#1C1A14] hover:bg-[#FF5C3A] hover:text-[#FFFFFF] transition-colors group bg-[#FAFAF7] shadow-[2px_2px_0px_#1C1A14] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            onClick={() => handleDelete(event.id, event.name)}
                          >
                            <Trash2 className="h-4 w-4 text-[#1C1A14] group-hover:text-[#FFFFFF]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === "participants" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[2px] border-[#1C1A14] pb-4">
              <div>
                <h1 className="text-[48px] font-anton text-[#1C1A14] uppercase leading-none">Participants</h1>
                <p className="text-[#6B6352] font-sans mt-2">View and manage registered participants</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1C1A14]" />
                  <Input
                    placeholder="SEARCH..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 rounded-none border-[2px] border-[#1C1A14] bg-[#FFFFFF] font-mono text-sm placeholder:text-[#A89F8C] uppercase"
                  />
                </div>

                {/* ⚡ PL/SQL Enrollment Checker Tool */}
                <div className="flex items-center gap-0 border-[2px] border-[#F5E642] shadow-[3px_3px_0px_#1C1A14] h-12">
                  <div className="bg-[#F5E642] px-2 h-full flex items-center border-r-[2px] border-[#1C1A14] shrink-0">
                    <span className="font-mono text-[10px] font-bold text-[#1C1A14] uppercase tracking-widest leading-tight text-center">
                      PL/SQL
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Student ID…"
                    value={checkStudentId}
                    onChange={(e) => setCheckStudentId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckEnrollments()}
                    className="h-full px-3 bg-[#FFFFFF] font-mono text-sm text-[#1C1A14] placeholder:text-[#A89F8C] outline-none w-36 border-r-[2px] border-[#1C1A14]"
                  />
                  <button
                    onClick={handleCheckEnrollments}
                    className="h-full px-4 bg-[#1C1A14] text-[#F5E642] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#2D1B4E] transition-colors whitespace-nowrap"
                  >
                    CHECK
                  </button>
                </div>

                <Dialog open={isParticipantDialogOpen} onOpenChange={setIsParticipantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary h-12 rounded-none whitespace-nowrap">
                      <Plus className="h-4 w-4 mr-2" />
                      ADD PARTICIPANT
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#FFFFFF] border-[2px] border-[#1C1A14] rounded-none shadow-[8px_8px_0px_#1C1A14]">
                    <DialogHeader>
                      <DialogTitle className="font-anton text-[28px] uppercase text-[#1C1A14]">Add Participant</DialogTitle>
                      <DialogDescription className="font-sans text-[#6B6352]">Register a new student</DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="py-4">
                      <Field>
                        <FieldLabel className="font-sans font-bold">Username</FieldLabel>
                        <Input
                          value={newParticipant.username}
                          onChange={(e) => setNewParticipant({ ...newParticipant, username: e.target.value })}
                          placeholder="e.g. john123"
                          className="rounded-none border-[2px] border-[#1C1A14]"
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="font-sans font-bold">Password</FieldLabel>
                        <Input
                          type="password"
                          value={newParticipant.password}
                          onChange={(e) => setNewParticipant({ ...newParticipant, password: e.target.value })}
                          placeholder="Password"
                          className="rounded-none border-[2px] border-[#1C1A14]"
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="font-sans font-bold">Full Name</FieldLabel>
                        <Input
                          value={newParticipant.name}
                          onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="rounded-none border-[2px] border-[#1C1A14]"
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="font-sans font-bold">College</FieldLabel>
                        <Input
                          value={newParticipant.college}
                          onChange={(e) => setNewParticipant({ ...newParticipant, college: e.target.value })}
                          placeholder="e.g. State University"
                          className="rounded-none border-[2px] border-[#1C1A14]"
                        />
                      </Field>
                    </FieldGroup>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" className="btn-secondary" onClick={() => setIsParticipantDialogOpen(false)}>
                        CANCEL
                      </Button>
                      <Button onClick={handleAddParticipant} className="btn-primary">
                        REGISTER
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Participants Table */}
            <div className="border-[2px] border-[#1C1A14] bg-[#FFFFFF] shadow-[4px_4px_0px_#1C1A14] overflow-x-auto">
              <table className="editorial-table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Student ID</th>
                    <th className="text-left">Name</th>
                    <th className="text-left">College Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((participant) => (
                      <tr key={participant.student_id}>
                        <td className="font-mono text-[#6B6352]">{participant.student_id}</td>
                        <td className="font-bold text-[#1C1A14] flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#2D1B4E] rounded-full flex items-center justify-center border border-[#1C1A14]">
                            <span className="font-anton text-[#FFFFFF] text-xs leading-none">
                              {participant.name.split(" ").map((n: string) => n[0]).join("")}
                            </span>
                          </div>
                          {participant.name}
                        </td>
                        <td className="font-bold text-[#1C1A14]">{participant.college_name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-16">
                        <Users className="h-12 w-12 mx-auto mb-4 text-[#D9D3C8]" />
                        <p className="font-anton text-xl uppercase text-[#1C1A14]">No Participants Found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ⚡ PL/SQL Result Modal */}
      {adminModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1A14] border-[2px] border-[#F5E642] shadow-[8px_8px_0px_#F5E642] max-w-md w-full text-center p-8">
            <p className="font-mono text-[10px] text-[#F5E642] uppercase tracking-[0.3em] mb-4">PL/SQL FUNCTION RESULT</p>
            <p className={`font-anton text-xl uppercase leading-snug mb-8 ${adminModal.isError ? 'text-[#FF5C3A]' : 'text-[#FFFFFF]'
              }`}>
              {adminModal.message}
            </p>
            <button
              onClick={() => setAdminModal({ isOpen: false, message: '', isError: false })}
              className="bg-[#F5E642] text-[#1C1A14] px-10 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#FFFFFF] transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
