"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, User, MapPin, Phone, Mail } from "lucide-react"
import { format } from "date-fns"
import { getAllAppointments } from "@/lib/appointment-service"
import { useAuth } from "@/lib/auth-provider"

export function TodaysAppointments() {
  const { currentLocation } = useAuth()
  const [todaysAppointments, setTodaysAppointments] = useState<any[]>([])

  useEffect(() => {
    // Get all appointments from the service
    const appointments = getAllAppointments()

    // Filter appointments for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      aptDate.setHours(0, 0, 0, 0)

      // Filter by location if not "all"
      const locationMatch = currentLocation === "all" || apt.location === currentLocation

      return aptDate >= today && aptDate < tomorrow && locationMatch
    })

    // Sort by time
    filtered.sort((a, b) => {
      const timeA = a.time || "00:00"
      const timeB = b.time || "00:00"
      return timeA.localeCompare(timeB)
    })

    setTodaysAppointments(filtered)
  }, [currentLocation])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Today's Appointments</CardTitle>
          <CardDescription>
            {todaysAppointments.length} appointment{todaysAppointments.length !== 1 ? 's' : ''} scheduled for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {todaysAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{appointment.time || "Not set"}</span>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status || "Pending"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.clientName || "Unknown Client"}</span>
                        </div>

                        {appointment.clientPhone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{appointment.clientPhone}</span>
                          </div>
                        )}

                        {appointment.clientEmail && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{appointment.clientEmail}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.serviceName || "Service not specified"}</span>
                        </div>

                        {appointment.staffName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>with {appointment.staffName}</span>
                          </div>
                        )}

                        {appointment.locationName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.locationName}</span>
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <p className="text-muted-foreground">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
