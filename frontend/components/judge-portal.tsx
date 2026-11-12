"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Award, Clock, MapPin, ArrowLeft, CheckCircle, Send } from "lucide-react"
import { toast } from "sonner"

type JudgeView = "events" | "scoring"

interface AssignedEvent {
  id: string
  name: string
  category: string
  time: string
  venue: string
  status: "upcoming" | "in-progress"
}

interface Participant {
  id: string
  name: string
  team: string
  marks: string
  feedback: string
  submitted: boolean
}


interface JudgePortalProps {
  judgeId?: string | null
}

export function JudgePortal({ judgeId }: JudgePortalProps) {
  const [activeView, setActiveView] = useState<JudgeView>("events")
  const [selectedEvent, setSelectedEvent] = useState<AssignedEvent | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [assignedEvents, setAssignedEvents] = useState<AssignedEvent[]>([])
  const [judgeModal, setJudgeModal] = useState({ isOpen: false, message: '', isError: false })

  useEffect(() => {
    const fetchAssignedEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/events")
        if (res.ok) {
          const data = await res.json()
          setAssignedEvents(data)
        }
      } catch (err) {
        console.error("Failed to fetch events", err)
      }
    }
    fetchAssignedEvents()
  }, [])

  useEffect(() => {
    const fetchParticipants = async () => {
      // Ensure we have an event ID before fetching
      if (!selectedEvent?.id) return; 

      try {
        const response = await fetch(`http://localhost:5000/api/events/${selectedEvent.id}/participants`);
        const result = await response.json();
        
        if (result.success) {
          const formatted = result.data.map((s: any) => ({
            id: s.enrollment_id, // Map enrollment_id to id
            name: s.name,
            team: "-",
            marks: "",
            feedback: "",
            submitted: false
          }));
          setParticipants(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch participants:", error);
      }
    };

    fetchParticipants();
  }, [selectedEvent?.id]);

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

  const handleOpenScoring = (event: AssignedEvent) => {
    setSelectedEvent(event)
    setActiveView("scoring")
  }

  const handleBackToEvents = () => {
    setActiveView("events")
    setSelectedEvent(null)
  }

  const handleMarksChange = (participantId: string, marks: string) => {
    // ⚡ Frontend validation REMOVED to demonstrate PostgreSQL trigger
    setParticipants(
      participants.map((p) => (p.id === participantId ? { ...p, marks } : p))
    )
  }

  const handleFeedbackChange = (participantId: string, feedback: string) => {
    setParticipants(
      participants.map((p) => (p.id === participantId ? { ...p, feedback } : p))
    )
  }

  const handleSubmitScore = async (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId)
    if (!participant?.marks) {
      toast.error("Please enter marks before submitting")
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/api/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          marks: parseInt(participant.marks), 
          feedback: participant.feedback,
          enrollment_id: participant.id,
          judge_id: judgeId || "J01"
        })
      })

      const data = await res.json()

      if (!data.success) {
        // ⚡ DATABASE TRIGGER FIRED — Show custom modal with raw PostgreSQL error
        setJudgeModal({ isOpen: true, message: data.message, isError: true })
        return
      }

      setParticipants(
        participants.map((p) =>
          p.id === participantId ? { ...p, submitted: true } : p
        )
      )
      toast.success("Score submitted successfully!", {
        description: `Marks for ${participant.name} have been recorded.`,
      })
    } catch (err) {
      toast.error("Failed to connect to server")
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAF7] p-6 lg:p-10 page-animate">
      {activeView === "events" ? (
        <div className="max-w-5xl mx-auto space-y-8">
          <div 
            className="w-full h-[200px] border-[2px] border-[#1C1A14] shadow-[8px_8px_0px_#1C1A14] flex flex-col justify-end p-8"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(28,26,20,0.9), rgba(28,26,20,0.2)), url('https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=1200&q=80')`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <h1 className="text-[40px] font-anton text-[#FFFFFF] uppercase leading-none">My Assigned Events</h1>
            <p className="text-[#F5F2EC] font-sans opacity-90 mt-2">Select an event to start scoring</p>
          </div>

          <div className="grid gap-6 mt-8">
            {assignedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-[#FFFFFF] border-[2px] border-[#1C1A14] rounded-none shadow-[4px_4px_0px_#1C1A14] hover:shadow-[6px_6px_0px_#1C1A14] transition-all duration-200 cursor-pointer hover:-translate-y-1"
                onClick={() => handleOpenScoring(event)}
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-[28px] font-anton text-[#1C1A14] uppercase leading-none">{event.name}</h2>
                        <span className={`inline-block px-3 py-1 font-mono text-xs text-[#FFFFFF] badge-${event.category.toLowerCase()}`}>
                          {event.category.toUpperCase()}
                        </span>
                        {event.status === "in-progress" && (
                          <span className="in-progress-badge">
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-6 text-sm text-[#6B6352] font-mono">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#1C1A14]" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#1C1A14]" />
                          <span>{event.venue.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="btn-primary py-3 px-6 shrink-0 flex items-center justify-center text-sm" 
                      onClick={(e) => { e.stopPropagation(); handleOpenScoring(event); }}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      OPEN SCORING SHEET
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-[2px] border-[#1C1A14] pb-6">
            <div>
              <button
                onClick={handleBackToEvents}
                className="mb-4 text-[#FF5C3A] hover:underline font-sans font-bold flex items-center text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </button>
              <h1 className="text-[40px] font-anton text-[#1C1A14] uppercase leading-none">
                Scoring: {selectedEvent?.name}
              </h1>
              <p className="text-[#6B6352] font-sans mt-2">
                Enter marks (0-100) and feedback for each participant
              </p>
            </div>
            <span className={`mt-2 sm:mt-0 inline-block px-4 py-2 font-mono text-sm text-[#FFFFFF] badge-${selectedEvent?.category.toLowerCase()}`}>
              {selectedEvent?.category.toUpperCase()}
            </span>
          </div>

          {/* Scoring Table */}
          <div className="border-[2px] border-[#1C1A14] rounded-none bg-[#FFFFFF] shadow-[4px_4px_0px_#1C1A14]">
            <div className="p-4 border-b-[2px] border-[#1C1A14] bg-[#2D1B4E] flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="font-anton text-xl text-[#FFFFFF] uppercase flex items-center gap-2">
                <Award className="h-5 w-5 text-[#F5E642]" />
                Participants
              </h2>
              <div className="flex flex-col items-end w-full sm:w-auto">
                <span className="font-mono text-xs text-[#F5F2EC] mb-2 uppercase tracking-widest">
                  {participants.filter((p) => p.submitted).length} OF {participants.length} SCORES SUBMITTED
                </span>
                <div className="w-full sm:w-48 h-[6px] bg-[#EDE8DF]">
                  <div
                    className="h-full bg-[#F5E642] transition-all duration-500"
                    style={{ width: `${(participants.filter((p) => p.submitted).length / participants.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto p-0">
              <table className="editorial-table scoring-table w-full">
                <thead>
                  <tr>
                    <th className="text-left w-[200px]">Team/Participant</th>
                    <th className="text-left">Members</th>
                    <th className="text-left w-[120px]">Marks (0-100)</th>
                    <th className="text-left w-[250px]">Feedback</th>
                    <th className="text-center w-[140px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#6B6352] font-sans font-medium text-lg border-b border-[#D9D3C8]">
                        No students enrolled in this event yet.
                      </td>
                    </tr>
                  ) : (
                    participants.map((participant) => (
                      <tr
                        key={participant.id}
                        className={`
                          transition-colors border-b border-[#D9D3C8] last:border-0
                          ${participant.submitted ? "bg-[#F0FDF4] border-l-[4px] border-l-[#4A7C59]" : "bg-[#FFFFFF] hover:bg-[#FAFAF7] border-l-[4px] border-l-transparent"}
                        `}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {participant.submitted && (
                              <CheckCircle className="h-4 w-4 text-[#4A7C59]" />
                            )}
                            <span className="font-anton text-[20px] text-[#1C1A14] uppercase leading-none">{participant.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-[#6B6352] leading-relaxed">
                          {participant.team}
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            value={participant.marks}
                            onChange={(e) => handleMarksChange(participant.id, e.target.value)}
                            placeholder="e.g. 150"
                            disabled={participant.submitted}
                            className="w-20 p-2 font-mono text-sm border-[2px] border-[#1C1A14] disabled:opacity-50 disabled:bg-[#FAFAF7]"
                          />
                          {/* ⚡ min/max removed — DB trigger enforces 0-100 */}
                        </td>
                        <td className="p-4">
                          <textarea
                            value={participant.feedback}
                            onChange={(e) => handleFeedbackChange(participant.id, e.target.value)}
                            placeholder="Feedback..."
                            disabled={participant.submitted}
                            className="w-full min-h-[44px] p-2 resize-none font-mono text-sm border-[2px] border-[#1C1A14] disabled:opacity-50 disabled:bg-[#FAFAF7]"
                            rows={1}
                          />
                        </td>
                        <td className="p-4 text-center">
                          {participant.submitted ? (
                            <span className="inline-block px-3 py-1 font-mono text-xs font-bold text-[#4A7C59] border-[2px] border-[#4A7C59] bg-[#4A7C59]/10">
                              SUBMITTED
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSubmitScore(participant.id)}
                              className="btn-primary py-[6px] px-[16px] text-xs flex items-center justify-center w-full"
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              SUBMIT
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ Database Trigger / Notification Modal */}
      {judgeModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1A14] border-[2px] border-[#F5E642] shadow-[8px_8px_0px_#F5E642] max-w-md w-full text-center p-8">
            <p className="font-mono text-[10px] text-[#F5E642] uppercase tracking-[0.3em] mb-2">DATABASE NOTIFICATION</p>
            <div className="w-12 h-[2px] bg-[#F5E642] mx-auto mb-6" />
            <p className={`font-anton text-xl uppercase leading-snug mb-8 ${
              judgeModal.isError ? 'text-[#FF5C3A]' : 'text-[#FFFFFF]'
            }`}>
              {judgeModal.message}
            </p>
            <button
              onClick={() => setJudgeModal({ isOpen: false, message: '', isError: false })}
              className="bg-[#F5E642] text-[#1C1A14] px-10 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#FFFFFF] transition-colors"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
