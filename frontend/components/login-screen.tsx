"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import type { UserRole } from "@/app/page"
import { toast } from "sonner"

interface LoginScreenProps {
  onLogin: (role: UserRole, referenceId?: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [selectedRole, setSelectedRole] = useState('Student')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [college, setCollege] = useState("")

  const testCredentials: Record<string, { email: string, password: string }> = {
    Student: { email: 'student@gmail.com', password: 'student123' },
    Admin: { email: 'admin@gmail.com', password: 'admin123' },
    Judge: { email: 'judge@gmail.com', password: 'judge123' }
  };

  const executeLoginFetch = async (loginEmail: string, loginPassword: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginEmail, password: loginPassword })
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.message || "Invalid credentials")
        return
      }

      const normalizeRole = (r: string) => {
        if (!r) return "Student";
        const lower = r.toLowerCase();
        if (lower === "organizer" || lower === "admin") return "Admin";
        if (lower === "judge") return "Judge";
        return "Student";
      };

      const normalizedDbRole = normalizeRole(data.user.role);

      if (selectedRole !== normalizedDbRole) {
        toast.error("Unauthorized: Your account does not have privileges for this role.");
        return;
      }

      toast.success("Login successful!")
      const roleMap: Record<string, UserRole> = {
        "Student": "student",
        "Admin": "admin",
        "Judge": "judge"
      }
      const mappedRole = roleMap[normalizedDbRole] || "student"
      onLogin(mappedRole, data.user.referenceId)
    } catch (err) {
      toast.error("Network error during login")
    }
  }

  const handleQuickLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    const creds = testCredentials[selectedRole];
    if (creds) {
      executeLoginFetch(creds.email, creds.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSignUp) {
      if (!email || !password || !name || !college) {
        toast.error("Please fill in all fields.")
        return
      }

      try {
        const res = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password, name, college })
        })
        const data = await res.json()

        if (res.ok && data.success) {
          toast.success(data.message)
          onLogin("student", data.user.studentId)
        } else {
          toast.error(data.message || "Registration failed")
        }
      } catch (err) {
        toast.error("Server error during registration")
      }
    } else {
      if (!email || !password) {
        toast.error("Please enter both username and password")
        return
      }
      await executeLoginFetch(email, password)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(45,27,78,0.82) 0%, rgba(28,26,20,0.7) 100%), url('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-anton tracking-wide">
            <span className="text-[#FFFFFF]">Fest</span><span className="text-[#FF5C3A]">Command</span>
          </h1>
        </div>

        <Card className="bg-[#FFFFFF] rounded-none border-[2px] border-[#1C1A14] shadow-[8px_8px_0px_#1C1A14] p-4 sm:p-8">
          <CardHeader className="text-center pb-6 px-0 pt-0">
            <CardTitle className="font-anton text-[36px] text-[#1C1A14] uppercase">
              {isSignUp ? "Register" : "Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isSignUp && (
                <div className="space-y-3 mb-2">
                  <p className="text-sm font-sans text-[#6B6352] text-center font-bold">I am a...</p>
                  <div className="flex gap-2 justify-center">
                    {['Student', 'Admin', 'Judge'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`
                          flex-1 py-[8px] px-[12px] sm:px-[16px] border-[2px] border-[#1C1A14] rounded-none text-sm font-sans font-bold transition-all
                          ${selectedRole === role
                            ? "bg-[#F5E642] text-[#1C1A14]"
                            : "bg-transparent text-[#1C1A14] hover:bg-[#1C1A14] hover:text-[#FFFFFF]"
                          }
                        `}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email" className="font-sans text-[#1C1A14] font-medium">
                    {isSignUp ? "Username / Email" : "Email Address"}
                  </FieldLabel>
                  <Input
                    id="email"
                    type="text"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-sans"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password" className="font-sans text-[#1C1A14] font-medium">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-sans"
                  />
                </Field>

                {isSignUp && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="name" className="font-sans text-[#1C1A14] font-medium">Full Name</FieldLabel>
                      <Input
                        id="name"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="font-sans"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="college" className="font-sans text-[#1C1A14] font-medium">College Name</FieldLabel>
                      <Input
                        id="college"
                        type="text"
                        placeholder="e.g. State University"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="font-sans"
                      />
                    </Field>
                  </>
                )}
              </FieldGroup>

              <Button
                type="submit"
                className="w-full btn-primary text-lg py-6 mt-6"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>

              {!isSignUp && testCredentials[selectedRole] && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickLogin}
                  className="w-full mt-3 border-[2px] border-[#1C1A14] bg-[#FAFAF7] text-[#1C1A14] hover:bg-[#1C1A14] hover:text-[#FFFFFF] transition-colors shadow-[2px_2px_0px_#1C1A14] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                >
                  Login as {testCredentials[selectedRole].email}
                </Button>
              )}
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-sans text-[#FF5C3A] hover:underline"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="inline-block font-anton text-[11px] tracking-[0.15em] text-[#F5F2EC] opacity-80 rotate-[-2deg]">
            EST. 2024 — UNIVERSITY FEST
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mt-12 w-full bg-[#2D1B4E] text-[#FFFFFF] font-mono text-xs py-3 px-4 border-[2px] border-[#1C1A14] flex justify-between items-center shadow-[4px_4px_0px_#1C1A14]">
          <span>SYSTEM: 24/7 ONLINE</span>
          <span>128 ACTIVE EVENTS</span>
        </div>
      </div>
    </div>
  )
}
