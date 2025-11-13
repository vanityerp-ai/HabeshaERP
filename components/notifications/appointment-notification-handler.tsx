"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { useRealTimeEvent } from "@/hooks/use-real-time-updates"
import { RealTimeEventType } from "@/lib/real-time-service"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Button } from "@/components/ui/button"
import { Calendar, Eye } from "lucide-react"
import { format } from "date-fns"
import { useNotificationAudio } from './notification-audio-context'

interface AppointmentNotificationHandlerProps {
  onViewAppointment?: (appointmentId: string) => void
}

export function AppointmentNotificationHandler({
  onViewAppointment
}: AppointmentNotificationHandlerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { playNotificationSound } = useNotificationAudio();

  // Subscribe to appointment created events
  useRealTimeEvent(
    RealTimeEventType.APPOINTMENT_CREATED,
    (payload, event) => {
      if (!user) {
        return
      }

      console.log("📅 New appointment notification received:", payload)

      const {
        clientName,
        service,
        date,
        amount,
        bookingReference,
        appointment
      } = payload

      // Role-based notification filtering
      const userRole = user.role.toUpperCase()
      const isAdminRole = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "ORG_ADMIN"
      const isManagerRole = userRole === "MANAGER" || userRole === "LOCATION_MANAGER"
      const isReceptionistRole = userRole === "RECEPTIONIST"
      const isStaffRole = userRole === "STAFF"

      // Admin, Manager, and Receptionist receive ALL appointment notifications
      if (isAdminRole || isManagerRole || isReceptionistRole) {
        // Show notification (continue to existing code below)
      }
      // Staff users only receive notifications for appointments where they are assigned
      else if (isStaffRole) {
        const appointmentStaffId = appointment?.staffId || event.userId
        if (appointmentStaffId !== user.id) {
          console.log(`🔕 Skipping notification - staff user ${user.id} not assigned to appointment (assigned to: ${appointmentStaffId})`)
          return
        }
        console.log(`🔔 Showing notification - staff user ${user.id} is assigned to this appointment`)
      }
      // Other roles don't receive appointment notifications
      else {
        return
      }

      // Format the date for display
      let formattedDate = "Unknown date"
      try {
        if (date) {
          const appointmentDate = new Date(date)
          formattedDate = format(appointmentDate, "MMM d, yyyy 'at' h:mm a")
        }
      } catch (error) {
        console.error("Error formatting appointment date:", error)
      }

      // Show toast notification
      toast({
        title: "📅 New Booking Received!",
        description: (
          <div className="space-y-3">
            <p>
              <strong>{clientName}</strong> booked an appointment
            </p>
            <p className="text-sm text-muted-foreground">
              {service} • {formattedDate}
            </p>
            {bookingReference && (
              <p className="text-xs text-muted-foreground">
                Ref: {bookingReference}
              </p>
            )}
            {amount && (
              <div className="font-semibold">
                <CurrencyDisplay amount={amount} />
              </div>
            )}
            <div className="flex gap-2">
              {onViewAppointment && appointment?.id && (
                <Button
                  size="sm"
                  onClick={() => onViewAppointment(appointment.id)}
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  View Calendar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Navigate to appointments page
                  window.location.href = '/dashboard/appointments'
                }}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View All
              </Button>
            </div>
          </div>
        ),
        duration: 15000, // Show for 15 seconds
      })

      // Play notification sound
      playNotificationSound();
    },
    [user, toast, onViewAppointment, playNotificationSound]
  )

  // Subscribe to appointment status changes
  useRealTimeEvent(
    RealTimeEventType.APPOINTMENT_STATUS_CHANGED,
    (payload, event) => {
      if (!user) {
        return
      }

      console.log("📋 Appointment status changed:", payload)

      const { appointment, newStatus, previousStatus } = payload

      // Role-based notification filtering (same logic as appointment created)
      const userRole = user.role.toUpperCase()
      const isAdminRole = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "ORG_ADMIN"
      const isManagerRole = userRole === "MANAGER" || userRole === "LOCATION_MANAGER"
      const isReceptionistRole = userRole === "RECEPTIONIST"
      const isStaffRole = userRole === "STAFF"

      // Admin, Manager, and Receptionist receive ALL appointment status change notifications
      if (isAdminRole || isManagerRole || isReceptionistRole) {
        // Show notification (continue to existing code below)
      }
      // Staff users only receive notifications for appointments where they are assigned
      else if (isStaffRole) {
        const appointmentStaffId = appointment?.staffId || event.userId
        if (appointmentStaffId !== user.id) {
          console.log(`🔕 Skipping status change notification - staff user ${user.id} not assigned to appointment`)
          return
        }
        console.log(`🔔 Showing status change notification - staff user ${user.id} is assigned to this appointment`)
      }
      // Other roles don't receive appointment status change notifications
      else {
        return
      }

      // Only show notifications for significant status changes
      if (newStatus === 'cancelled' || newStatus === 'completed') {
        toast({
          title: `Appointment ${newStatus === 'cancelled' ? 'Cancelled' : 'Completed'}`,
          description: `${appointment.clientName}'s appointment has been ${newStatus}.`,
          duration: 5000,
        })
      }
    },
    [user, toast]
  )

  // This component doesn't render anything visible
  return null
}
