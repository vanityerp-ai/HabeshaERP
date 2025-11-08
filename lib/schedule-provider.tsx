"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { StaffSchedule, TimeOffRequest, ScheduleStorage } from "@/lib/schedule-storage"

// Define the context type
interface ScheduleContextType {
  schedules: StaffSchedule[]
  timeOffRequests: TimeOffRequest[]
  refreshSchedules: () => void
  addSchedule: (schedule: Omit<StaffSchedule, "id">) => StaffSchedule
  updateSchedule: (schedule: StaffSchedule) => boolean
  deleteSchedule: (scheduleId: string) => void
  getStaffSchedule: (staffId: string) => StaffSchedule[]
  addTimeOffRequest: (request: Omit<TimeOffRequest, "id" | "createdAt" | "updatedAt">) => TimeOffRequest
  updateTimeOffRequest: (request: TimeOffRequest) => boolean
  deleteTimeOffRequest: (requestId: string) => void
  getStaffTimeOffRequests: (staffId: string) => TimeOffRequest[]
}

// Create the context with default values
const ScheduleContext = createContext<ScheduleContextType>({
  schedules: [],
  timeOffRequests: [],
  refreshSchedules: () => {},
  addSchedule: () => ({ id: "", staffId: "", day: "", startTime: "", endTime: "", location: "", isRecurring: false, isDayOff: false }),
  updateSchedule: () => false,
  deleteSchedule: () => {},
  getStaffSchedule: () => [],
  addTimeOffRequest: () => ({
    id: "",
    staffId: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "pending",
    createdAt: "",
    updatedAt: ""
  }),
  updateTimeOffRequest: () => false,
  deleteTimeOffRequest: () => {},
  getStaffTimeOffRequests: () => []
})

// Create the provider component
export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([])
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load initial data from API with localStorage fallback
  useEffect(() => {
    if (isInitialized) return

    async function loadData() {
      // Load schedules from localStorage (already in database via StaffSchedule table)
      const storedSchedules = ScheduleStorage.getSchedules()
      setSchedules(storedSchedules)

      // Try to load time-off requests from API
      try {
        const response = await fetch('/api/time-off')
        if (response.ok) {
          const data = await response.json()
          const requests = data.timeOffRequests.map((req: any) => ({
            id: req.id,
            staffId: req.staffId,
            startDate: req.startDate,
            endDate: req.endDate,
            reason: req.reason,
            status: req.status,
            notes: req.notes,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            updatedBy: req.updatedBy,
          }))
          setTimeOffRequests(requests)
          // Also save to localStorage as backup
          ScheduleStorage.saveTimeOffRequests(requests)
          console.log('Loaded time-off requests from API:', requests.length)
        } else {
          throw new Error('API request failed')
        }
      } catch (error) {
        console.warn('Failed to load time-off requests from API, using localStorage:', error)
        const storedTimeOffRequests = ScheduleStorage.getTimeOffRequests()
        setTimeOffRequests(storedTimeOffRequests)
      }

      setIsInitialized(true)
    }

    loadData()
  }, [isInitialized])

  // Refresh schedules from storage
  const refreshSchedules = useCallback(() => {
    const storedSchedules = ScheduleStorage.getSchedules()
    const storedTimeOffRequests = ScheduleStorage.getTimeOffRequests()

    setSchedules(storedSchedules)
    setTimeOffRequests(storedTimeOffRequests)
  }, [])

  // Add a new schedule
  const addSchedule = useCallback((schedule: Omit<StaffSchedule, "id">) => {
    const newSchedule = ScheduleStorage.addSchedule(schedule)
    setSchedules(prev => [...prev, newSchedule])
    return newSchedule
  }, [])

  // Update an existing schedule
  const updateSchedule = useCallback((schedule: StaffSchedule) => {
    const success = ScheduleStorage.updateSchedule(schedule)
    if (success) {
      setSchedules(prev =>
        prev.map(s => s.id === schedule.id ? schedule : s)
      )
    }
    return success
  }, [])

  // Delete a schedule
  const deleteSchedule = useCallback((scheduleId: string) => {
    ScheduleStorage.deleteSchedule(scheduleId)
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))
  }, [])

  // Get schedules for a specific staff member
  const getStaffSchedule = useCallback((staffId: string) => {
    return schedules.filter(s => s.staffId === staffId)
  }, [schedules])

  // Add a new time off request
  const addTimeOffRequest = useCallback((request: Omit<TimeOffRequest, "id" | "createdAt" | "updatedAt">) => {
    const newRequest = ScheduleStorage.addTimeOffRequest(request)
    setTimeOffRequests(prev => [...prev, newRequest])

    // Save to API asynchronously
    (async () => {
      try {
        const response = await fetch('/api/time-off', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: request.staffId,
            startDate: request.startDate,
            endDate: request.endDate,
            reason: request.reason,
            status: request.status || 'pending',
            notes: request.notes,
          }),
        })
        if (response.ok) {
          console.log('✅ Time-off request saved to database')
        }
      } catch (error) {
        console.warn('Failed to save time-off request to API:', error)
      }
    })()

    return newRequest
  }, [])

  // Update an existing time off request
  const updateTimeOffRequest = useCallback((request: TimeOffRequest) => {
    const success = ScheduleStorage.updateTimeOffRequest(request)
    if (success) {
      setTimeOffRequests(prev =>
        prev.map(r => r.id === request.id ? request : r)
      )

      // Update in API asynchronously
      (async () => {
        try {
          const response = await fetch('/api/time-off', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })
          if (response.ok) {
            console.log('✅ Time-off request updated in database')
          }
        } catch (error) {
          console.warn('Failed to update time-off request in API:', error)
        }
      })()
    }
    return success
  }, [])

  // Delete a time off request
  const deleteTimeOffRequest = useCallback((requestId: string) => {
    ScheduleStorage.deleteTimeOffRequest(requestId)
    setTimeOffRequests(prev => prev.filter(r => r.id !== requestId))

    // Delete from API asynchronously
    (async () => {
      try {
        const response = await fetch(`/api/time-off?id=${requestId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          console.log('✅ Time-off request deleted from database')
        }
      } catch (error) {
        console.warn('Failed to delete time-off request from API:', error)
      }
    })()
  }, [])

  // Get time off requests for a specific staff member
  const getStaffTimeOffRequests = useCallback((staffId: string) => {
    return timeOffRequests.filter(r => r.staffId === staffId)
  }, [timeOffRequests])

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        timeOffRequests,
        refreshSchedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        getStaffSchedule,
        addTimeOffRequest,
        updateTimeOffRequest,
        deleteTimeOffRequest,
        getStaffTimeOffRequests
      }}
    >
      {children}
    </ScheduleContext.Provider>
  )
}

// Custom hook to use the schedule context
export const useSchedule = () => useContext(ScheduleContext)
