"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calendar,
  LayoutDashboard,
  MapPin,
  Clock,
  CheckCircle2,
  Trophy,
  CalendarDays,
} from "lucide-react"
import type { Event } from "@/app/page"

interface StudentPortalProps {
  events: Event[]
  studentId?: string | null
}

type SidebarView = "itinerary" | "dashboard"
type DayFilter = "all" | 1 | 2 | 3
type CategoryFilter = "All" | "Tech" | "Sports" | "Cultural"

export function StudentPortal({ events, studentId }: StudentPortalProps) {
  const [activeView, setActiveView] = useState<SidebarView>("itinerary")
  const [dayFilter, setDayFilter] = useState<DayFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All")
  const [enrolledEvents, setEnrolledEvents] = useState<string[]>([])
  const [pastResults, setPastResults] = useState<any[]>([])

  const [dashboardEvents, setDashboardEvents] = useState<any[]>([])

  const fetchMyEnrollments = async () => {
    if (!studentId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}/enrollments`);
      const result = await response.json();
      if (result.success) {
        setDashboardEvents(result.data);
        setEnrolledEvents(result.data.map((e: any) => e.id));
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    }
  }

  const fetchMyResults = async () => {
    if (!studentId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentId}/results`);
      const result = await response.json();
      if (result.success) {
        const mappedResults = result.data.map((r: any) => ({
          event: r.event_name,
          position: r.rank === 1 ? "1st Place" : r.rank === 2 ? "2nd Place" : r.rank === 3 ? "3rd Place" : `${r.rank}th Place`,
          prize: r.rank === 1 ? "Gold" : r.rank === 2 ? "Silver" : r.rank === 3 ? "Bronze" : "-"
        }));
        setPastResults(mappedResults);
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    }
  };

  useEffect(() => {
    fetchMyEnrollments();
    fetchMyResults();
  }, [studentId])

  const filteredEvents = events.filter((event) => {
    const matchesDay = dayFilter === "all" || event.day === dayFilter
    const matchesCategory = categoryFilter === "All" || event.category === categoryFilter
    return matchesDay && matchesCategory
  })

  const handleEnroll = async (eventId: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          student_id: studentId || 'S001', 
          event_id: eventId 
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Success: " + data.message);
        fetchMyEnrollments();
      } else {
        alert("Notice: " + data.message);
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
      alert("Network Error: Could not reach the server.");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Tech":
        return "bg-tech/20 text-tech border-tech/30"
      case "Sports":
        return "bg-sports/20 text-sports border-sports/30"
      case "Cultural":
        return "bg-cultural/20 text-cultural border-cultural/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getCategoryBorderColor = (category: string) => {
    switch (category) {
      case "Tech":
        return "border-l-tech"
      case "Sports":
        return "border-l-sports"
      case "Cultural":
        return "border-l-cultural"
      default:
        return "border-l-border"
    }
  }

  const sidebarItems = [
    { id: "itinerary" as const, label: "Fest Itinerary", icon: Calendar },
    { id: "dashboard" as const, label: "My Dashboard", icon: LayoutDashboard },
  ]

  const getEventImage = (category: string) => {
    switch (category) {
      case "Tech":
        return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
      case "Sports":
        return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80"
      case "Cultural":
        return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80"
      default:
        return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#F5F2EC] border-r border-[#D9D3C8] p-4 shrink-0">
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all duration-150 font-sans border-l-[3px] border-transparent
                ${
                  activeView === item.id
                    ? "bg-[#1C1A14] text-[#F5E642] font-bold border-l-transparent"
                    : "text-[#6B6352] hover:bg-[#EDE8DF] hover:text-[#1C1A14] hover:border-l-[#FF5C3A]"
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
        {activeView === "itinerary" ? (
          <div className="space-y-8">
            <div className="flex flex-col gap-6">
              {/* Fest Itinerary Banner */}
              <div 
                className="w-full h-[260px] relative flex flex-col justify-center px-8 sm:px-12 border-[2px] border-[#1C1A14] shadow-[8px_8px_0px_#1C1A14]"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(28,26,20,0.85) 40%, rgba(28,26,20,0.2) 100%), url('https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&q=80')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <h1 className="text-[#FFFFFF] text-[40px] sm:text-[56px] font-anton leading-none tracking-tight uppercase">Grand Festival<br/>Itinerary</h1>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-6 mt-4">
                {/* Day Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-[#6B6352]">DAY:</span>
                  <div className="flex flex-wrap gap-2">
                    {(["all", 1, 2, 3] as const).map((day) => (
                      <button
                        key={day}
                        onClick={() => setDayFilter(day)}
                        className={`
                          px-4 py-2 text-sm font-sans font-bold border-[2px] transition-colors
                          ${dayFilter === day 
                            ? "bg-[#F5E642] border-[#1C1A14] text-[#1C1A14]" 
                            : "bg-transparent border-[#1C1A14] text-[#1C1A14] hover:bg-[#1C1A14] hover:text-[#FFFFFF]"}
                        `}
                      >
                        {day === "all" ? "ALL" : `DAY ${day}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-[#6B6352]">CATEGORY:</span>
                  <div className="flex flex-wrap gap-2">
                    {(["All", "Tech", "Sports", "Cultural"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`
                          px-4 py-2 text-sm font-sans font-bold border-[2px] transition-colors
                          ${categoryFilter === cat
                            ? cat === "All" ? "bg-[#1C1A14] text-[#FFFFFF] border-[#1C1A14]" : `badge-${cat.toLowerCase()} border-[#1C1A14]`
                            : "bg-transparent border-[#1C1A14] text-[#1C1A14] hover:bg-[#1C1A14] hover:text-[#FFFFFF]"}
                        `}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#1C1A14] border-t-2" />

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <div key={event.id} className="event-card flex flex-col h-full bg-[#FFFFFF]">
                  <div className="event-card-img-wrap h-[180px]">
                    <img src={getEventImage(event.category)} alt={event.name} className="event-card-img" />
                    <div className={`event-card-badge badge-${event.category.toLowerCase()}`}>
                      {event.category.toUpperCase()}
                    </div>
                    <div className="event-card-time-chip">
                      DAY {event.day} — {event.time}
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <h2 className="text-[22px] font-anton text-[#2D1B4E] leading-tight mb-3 uppercase">{event.name}</h2>
                    
                    <div className="space-y-2 mb-6 flex-grow">
                      <div className="flex items-center gap-2 text-[#6B6352] font-mono text-xs">
                        <MapPin className="h-3.5 w-3.5 text-[#FF5C3A]" />
                        <span>{event.venue.toUpperCase()}</span>
                      </div>
                    </div>

                    {enrolledEvents.includes(event.id) ? (
                      <button className="w-full py-3 px-4 font-bold border-[2px] border-[#4A7C59] bg-[#4A7C59]/10 text-[#4A7C59] flex justify-center items-center gap-2 cursor-default" disabled>
                        <CheckCircle2 className="h-5 w-5" />
                        ENROLLED
                      </button>
                    ) : (
                      <button className="w-full btn-primary py-3" onClick={() => handleEnroll(event.id)}>
                        ENROLL NOW
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-16 text-[#6B6352]">
                <p className="font-anton text-2xl uppercase mb-2 text-[#1C1A14]">No Events Found</p>
                <p className="font-sans">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="border-b-[2px] border-[#1C1A14] pb-4">
              <h1 className="text-[40px] font-anton text-[#1C1A14] uppercase leading-none">My Dashboard</h1>
            </div>

            {/* Enrolled Events */}
            <div className="border-[2px] border-[#1C1A14] rounded-none bg-[#FFFFFF] shadow-[4px_4px_0px_#1C1A14]">
              <div className="p-4 border-b-[2px] border-[#1C1A14] bg-[#2D1B4E]">
                <h2 className="font-anton text-xl text-[#FFFFFF] uppercase flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#F5E642]" />
                  Upcoming Enrolled Events
                </h2>
              </div>
              <div className="p-6">
                {dashboardEvents.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-center justify-between p-4 border-[2px] border-[#1C1A14] bg-[#FAFAF7] hover:bg-[#F5F2EC] transition-colors`}
                      >
                        <div>
                          <p className="font-anton text-lg text-[#1C1A14] uppercase">{event.name}</p>
                          <p className="font-mono text-xs text-[#6B6352] mt-1">
                            DAY {event.day} | {event.time} | {event.venue.toUpperCase()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 font-mono text-xs text-[#FFFFFF] badge-${event.category.toLowerCase()}`}>
                          {event.category.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <svg className="mx-auto h-24 w-24 text-[#D9D3C8] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="4" width="18" height="18" rx="0" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <p className="font-anton text-xl text-[#1C1A14] uppercase">You haven't enrolled in any events yet!</p>
                    <p className="font-sans text-[#6B6352] mt-2">Head to the Fest Itinerary to explore and enroll!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Past Results */}
            <div className="border-[2px] border-[#1C1A14] rounded-none bg-[#FFFFFF] shadow-[4px_4px_0px_#1C1A14] overflow-hidden">
              <div className="p-4 border-b-[2px] border-[#1C1A14] bg-[#2D1B4E]">
                <h2 className="font-anton text-xl text-[#FFFFFF] uppercase flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#FF5C3A]" />
                  Past Results
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="editorial-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Position</th>
                      <th>Prize</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastResults.map((result, i) => (
                      <tr key={i}>
                        <td className="font-bold text-[#1C1A14]">{result.event}</td>
                        <td>
                          <span className={`inline-block px-2 py-1 font-mono text-xs border border-[#1C1A14] ${
                            result.position === "1st Place" ? "bg-[#F5E642] text-[#1C1A14]" :
                            result.position === "2nd Place" ? "bg-[#D9D3C8] text-[#1C1A14]" :
                            "bg-[#EDE8DF] text-[#6B6352] border-transparent"
                          }`}>
                            {result.position.toUpperCase()}
                          </span>
                        </td>
                        <td className="font-mono text-[#6B6352]">{result.prize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
