"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { set, isBefore, startOfDay, addMinutes, parseISO, format } from "date-fns"
import { formatAppDate, formatForDateInput, isToday } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { getFirstName } from "@/lib/female-avatars"
import { useApiStaff } from "@/lib/api-staff-service"
import { useServices } from "@/lib/service-provider"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { validateStaffAvailability } from "@/lib/appointment-service"
import { useStaffAvailabilitySync } from "@/hooks/use-staff-availability-sync"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import { useLocations } from "@/lib/location-provider"
import { useClients } from "@/lib/client-provider"

// Helper function to check if user has admin privileges
const hasAdminPrivileges = (role?: string) => {
  // If no role is provided, check if it might be a super_admin
  if (!role) {
    console.log("No role provided to hasAdminPrivileges");
    return false;
  }

  // Log the role for debugging
  console.log("Checking admin privileges for role:", role);

  // Check for admin roles
  return role === "super_admin" || role === "org_admin" || role === "location_manager";
}

interface NewAppointmentDialogV2Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date
  initialTime?: string
  initialStaffId?: string
  onAppointmentCreated?: (appointment: any) => void
  appointments?: any[] // Existing appointments to check for conflicts
}

export function NewAppointmentDialogV2({
  open,
  onOpenChange,
  initialDate = new Date(),
  initialTime,
  initialStaffId,
  onAppointmentCreated,
  appointments = [],
}: NewAppointmentDialogV2Props) {
  const { toast } = useToast()
  const { currentLocation, user } = useAuth()
  const { currency } = useCurrency()
  const { locations: storeLocations, isHomeServiceEnabled } = useLocations()

  // Fetch real staff data from HR system
  const { staff: realStaff, isLoading: isStaffLoading, fetchStaff } = useApiStaff()

  // Use real services and categories from service provider
  const { services, categories, refreshServices, refreshCategories } = useServices()

  // Use client provider for auto-registration and phone lookup
  const { autoRegisterClient, findClientByPhoneAndName, findClientByPhone } = useClients()

  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    phone: "",
    serviceId: "",
    date: initialDate,
    time: initialTime || "10:00",
    staffId: initialStaffId || "",
    location: currentLocation === "all" || currentLocation === "home" ? "loc1" : currentLocation,
    notes: "",
  })

  // Calculate time slot for staff availability checking
  const timeSlot = useMemo(() => {
    if (!formData.date || !formData.time || !formData.serviceId) return undefined;

    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) return undefined;

    const [hours, minutes] = formData.time.split(':').map(Number);
    const appointmentDate = new Date(formData.date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    return {
      start: appointmentDate,
      end: addMinutes(appointmentDate, selectedService.duration)
    };
  }, [formData.date, formData.time, formData.serviceId, services]);

  // Use staff availability sync for cross-location conflict detection
  const {
    getUnavailabilityIndicator,
    checkStaffAvailability: checkCrossLocationAvailability,
    staffAvailability
  } = useStaffAvailabilitySync({
    date: formData.date || initialDate,
    timeSlot,
    locationId: formData.location || currentLocation
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [unavailableStaff, setUnavailableStaff] = useState<string[]>([]);

  // Client lookup state
  const [clientLookupStatus, setClientLookupStatus] = useState<'idle' | 'found' | 'new'>('idle')
  const [foundClient, setFoundClient] = useState<any | null>(null)

  // Function to check if a staff member is available at a given time
  interface Appointment {
    staffId: string;
    additionalServices?: Array<{ staffId: string; completed: boolean; type: string }>;
    staffServiceCompleted: boolean;
    type: string;
    date: string;
    duration: number;
    id: string;
  }

  const checkStaffAvailability = (staffId: string, date: Date, time: string, duration = 60) => {
    if (!staffId || !date || !time) return true; // If any required data is missing, assume available

    // Parse the selected date and time
    const [hours, minutes] = time.split(":").map(Number);
    const startTime = set(date, { hours, minutes });
    const endTime = addMinutes(startTime, duration);

    // Check for conflicts with existing appointments and blocked time
    return !existingAppointments.some((appointment: Appointment) => {
      // STRICT RULE: Check if staff is the main provider or assigned to any additional service
      const isMainProvider = appointment.staffId === staffId;

      // Check if staff is assigned to any additional service
      const isAssignedToAdditionalService = appointment.additionalServices && appointment.additionalServices.some((s) => s.staffId === staffId);

      // If staff is not involved in this appointment at all, skip
      if (!isMainProvider && !isAssignedToAdditionalService) {
        return false;
      }

      // IMPORTANT: Skip completed appointments - they don't block staff availability
      if (appointment.status === "completed") {
        return false;
      }

      // IMPORTANT: Skip cancelled and no-show appointments - they don't block staff availability
      if (appointment.status === "cancelled" || appointment.status === "no-show") {
        return false;
      }

      // For blocked time entries, always consider them as conflicts
      if (appointment.type === "blocked") {
        // Parse appointment times
        const appointmentStart = parseISO(appointment.date);
        const appointmentEnd = addMinutes(appointmentStart, appointment.duration);

        // Check for overlap with blocked time
        const hasOverlap = (
          (startTime >= appointmentStart && startTime < appointmentEnd) || // New appointment starts during blocked time
          (endTime > appointmentStart && endTime <= appointmentEnd) || // New appointment ends during blocked time
          (startTime <= appointmentStart && endTime >= appointmentEnd) // New appointment completely covers blocked time
        );

        return hasOverlap;
      }

      // STRICT RULE: For regular appointments, if the staff is involved in any way,
      // they are not available for the entire duration of the service
      const appointmentStart = parseISO(appointment.date);
      const appointmentEnd = addMinutes(appointmentStart, appointment.duration);

      // Check for overlap
      return (
        (startTime >= appointmentStart && startTime < appointmentEnd) || // New appointment starts during existing
        (endTime > appointmentStart && endTime <= appointmentEnd) || // New appointment ends during existing
        (startTime <= appointmentStart && endTime >= appointmentEnd) // New appointment completely covers existing
      );
    });
  };

  // Fetch staff data and refresh services when dialog opens
  useEffect(() => {
    if (open) {
      if (!isStaffLoading && realStaff.length === 0) {
        fetchStaff();
      }
      // Refresh services and categories to ensure we have the latest data
      Promise.all([
        refreshServices(),
        refreshCategories()
      ]).catch(err => {
        console.error("Error refreshing services/categories:", err)
      })
    }
  }, [open, isStaffLoading, realStaff.length, fetchStaff, refreshServices, refreshCategories]);

  // Handle phone number lookup
  const handlePhoneLookup = (phone: string) => {
    if (!phone || phone.length < 8) {
      // Reset lookup status if phone is too short
      setClientLookupStatus('idle')
      setFoundClient(null)
      return
    }

    console.log('🔍 Looking up client by phone:', phone)

    // Search for existing client by phone number
    const existingClient = findClientByPhone(phone)

    if (existingClient) {
      console.log('✅ Client found:', existingClient.name)
      setClientLookupStatus('found')
      setFoundClient(existingClient)

      // Auto-populate name and email
      setFormData(prev => ({
        ...prev,
        clientName: existingClient.name,
        email: existingClient.email || ''
      }))

      // Visual feedback is provided by the green checkmark and border color
      // No toast needed to avoid focus/interaction issues
    } else {
      console.log('ℹ️ No client found - new client')
      setClientLookupStatus('new')
      setFoundClient(null)

      // Visual feedback is provided by the blue info icon and border color
      // No toast needed to avoid focus/interaction issues
    }
  }

  // Update unavailable staff when date, time, location, or service changes
  useEffect(() => {
    if (formData.date && formData.time && formData.serviceId && formData.location && realStaff.length > 0) {
      const selectedService = services.find(s => s.id === formData.serviceId);
      if (selectedService) {
        const duration = selectedService.duration;

        // Parse date and time to create time slot
        const [hours, minutes] = formData.time.split(':').map(Number);
        const appointmentDate = new Date(formData.date);
        appointmentDate.setHours(hours, minutes, 0, 0);
        const timeSlot = {
          start: appointmentDate,
          end: addMinutes(appointmentDate, duration)
        };

        console.log('🔍 Checking staff availability for:', {
          date: formData.date,
          time: formData.time,
          location: formData.location,
          duration,
          timeSlot
        });

        // Check each staff member's availability using cross-location availability check
        const checkAllStaff = async () => {
          const unavailableStaffIds: string[] = [];

          for (const staff of realStaff.filter(s => s.status === "Active")) {
            try {
              // Use the cross-location availability check from useStaffAvailabilitySync
              const availabilityStatus = await checkCrossLocationAvailability(
                staff.id,
                timeSlot,
                formData.location
              );

              if (!availabilityStatus.isAvailable) {
                unavailableStaffIds.push(staff.id);
                console.log(`❌ ${staff.name} is unavailable:`, availabilityStatus.reason);
              } else {
                console.log(`✅ ${staff.name} is available`);
              }
            } catch (error) {
              console.error(`Error checking availability for ${staff.name}:`, error);
              // On error, mark as unavailable to be safe
              unavailableStaffIds.push(staff.id);
            }
          }

          setUnavailableStaff(unavailableStaffIds);

          // If the currently selected staff is unavailable, clear the selection
          if (formData.staffId && unavailableStaffIds.includes(formData.staffId)) {
            const unavailableStaffMember = realStaff.find(s => s.id === formData.staffId);
            const updatedFormData = { ...formData, staffId: "" };
            setFormData(updatedFormData);

            toast({
              title: "Staff unavailable",
              description: `${unavailableStaffMember?.name || 'The selected staff member'} is not available at this time. Please choose another staff member or time.`,
              variant: "destructive"
            });
          }
        };

        checkAllStaff();
      }
    }
  }, [formData.date, formData.time, formData.serviceId, formData.location, realStaff, checkCrossLocationAvailability]);

  // Track previous open state to only reset form when dialog opens (not on every render)
  const [prevOpenState, setPrevOpenState] = useState(false);

  // Reset form only when dialog opens (changes from closed to open)
  useEffect(() => {
    console.log("Dialog open state changed:", open);

    // Only reset form when dialog transitions from closed to open
    if (open && !prevOpenState) {
      // Set existing appointments
      setExistingAppointments(appointments);

      // Calculate a valid initial time based on the selected date
      let validInitialTime = initialTime

      if (isToday(initialDate)) {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const isAdmin = hasAdminPrivileges(user?.role)
        // Check for both "loc4" and "home" as valid home service locations
        const isHomeService = currentLocation === "home" || formData.location === "loc4" || formData.location === "home"

        // Debug information
        console.log("Initial time setting - User role:", user?.role);
        console.log("Initial time setting - Is admin:", isAdmin);
        console.log("Initial time setting - Current location:", currentLocation);
        console.log("Initial time setting - Form location:", formData.location);
        console.log("Initial time setting - Is home service:", isHomeService);

        // Find the next available 15-minute slot
        let nextMinute = Math.ceil(currentMinute / 15) * 15
        let nextHour = currentHour

        // Handle case where rounding up minutes goes to the next hour
        if (nextMinute >= 60) {
          nextMinute = 0
          nextHour += 1
        }

        // For admins creating home service appointments, allow any time
        if (isAdmin && isHomeService) {
          validInitialTime = `${nextHour.toString().padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`
        }
        // For regular users or non-home service, enforce business hours (9 AM to 11:55 PM)
        else if (nextHour >= 9 && nextHour <= 23) {
          validInitialTime = `${nextHour.toString().padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`
        } else if (nextHour < 9) {
          // If before business hours, set to opening time
          validInitialTime = "09:00"
        } else {
          // If after business hours, set to next day opening
          validInitialTime = "09:00"
        }

        console.log("Setting initial time for today:", validInitialTime)
      } else if (!initialTime) {
        // For future dates, default to 10 AM if no time specified
        validInitialTime = "10:00"
      }

      // Make sure we have a valid time
      if (!validInitialTime) {
        validInitialTime = "10:00"
      }

      // Create a new form data object instead of using the spread operator with the current state
      const newFormData = {
        clientName: "",
        email: "",
        phone: "",
        serviceId: "",
        date: initialDate,
        time: validInitialTime,
        staffId: initialStaffId || "",
        location: currentLocation === "all" || currentLocation === "home" ? "loc1" : currentLocation,
        notes: "",
      };

      // Reset form data
      setFormData(newFormData);

      // Reset client lookup state
      setClientLookupStatus('idle')
      setFoundClient(null)

      // Don't reset the selected category when the dialog opens
      // This allows the category selection to persist

      console.log("Form reset - new form data:", newFormData);
    }

    // Update previous open state
    setPrevOpenState(open);
  }, [open, initialDate, initialTime, initialStaffId, appointments, prevOpenState])

  // Handle location changes separately without resetting the entire form
  useEffect(() => {
    // Only update the location in the form data when currentLocation changes
    // and don't reset other form fields
    if (open) {
      setFormData(prevData => ({
        ...prevData,
        location: currentLocation === "all" || currentLocation === "home" ? "loc1" : currentLocation,
      }));
    }
  }, [currentLocation, open]);

  // Create a mapping between category IDs and names using real categories
  const categoryIdToNameMap = new Map()
  const categoryNameToIdMap = new Map()

  categories.forEach(cat => {
    categoryIdToNameMap.set(cat.id, cat.name)
    categoryNameToIdMap.set(cat.name, cat.id)
  })

  // Log selected category for debugging
  useEffect(() => {
    console.log("Selected category changed to:", selectedCategory);

    // No need to synchronize with formData.serviceCategory anymore
    // We'll only use selectedCategory for the UI and filtering
  }, [selectedCategory]);

  // Create a memoized filtered services array instead of using an effect
  const computedFilteredServices = useMemo(() => {
    if (selectedCategory) {
      // Get the category name from the ID for comparison
      const selectedCategoryName = categoryIdToNameMap.get(selectedCategory);

      // Filter services by matching either category ID or category name
      return services.filter((service) => {
        // Services are stored with category names, so match by name primarily
        const matchByName = service.category === selectedCategoryName;
        const matchById = service.category === selectedCategory;

        return matchByName || matchById;
      });
    } else {
      return [];  // Return empty array when no category is selected
    }
  }, [selectedCategory, categoryIdToNameMap, services]);

  // Generate time options dynamically based on current date and time
  const timeOptions = useMemo(() => {
    // For debugging
    console.log("Generating time options for date:", formData.date);

    const options = [];
    const now = new Date();
    const isAdmin = hasAdminPrivileges(user?.role);
    // Check for both "loc4" and "home" as valid home service locations
    const isHomeService = formData.location === "loc4" || formData.location === "home" || currentLocation === "home";

    // Debug information
    console.log("User role:", user?.role);
    console.log("Is admin:", isAdmin);
    console.log("Current location:", currentLocation);
    console.log("Form location:", formData.location);
    console.log("Is home service:", isHomeService);

    // Special case for super_admin - always allow all hours
    if (user?.role === "super_admin") {
      console.log("Super admin detected - allowing all hours");
      return generateAllHoursOptions();
    }

    // For other admins creating home service appointments, allow all hours (24-hour access)
    if (isAdmin && isHomeService) {
      return generateAllHoursOptions();
    }

    // Make sure we have a valid date object
    if (!formData.date) {
      return generateBusinessHoursOptions(); // Return all business hours options as fallback
    }

    const selectedDateIsToday = isToday(formData.date);

    // For future dates, show all business hours
    if (!selectedDateIsToday) {
      return generateBusinessHoursOptions();
    }

    // For today, only show times from current minute forward
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    console.log("Current time:", currentHour, ":", currentMinute);

    // Business hours: 9 AM to 11:55 PM (or current hour if later than 9 AM)
    // For admins, allow booking from current hour regardless of business hours
    const startHour = isAdmin ? currentHour : Math.max(9, currentHour);
    const endHour = isAdmin ? 23 : 23; // Admins can book until midnight

    // Generate all possible time slots for today
    for (let hour = startHour; hour <= endHour; hour++) {
      // For the current hour, only show minutes in the future
      // For future hours, show all 15-minute intervals
      const minuteIntervals = [0, 15, 30, 45];

      for (const minute of minuteIntervals) {
        // Skip times in the past
        if (hour === currentHour && minute < currentMinute) {
          continue;
        }

        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const period = hour >= 12 ? "PM" : "AM";

        options.push({
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          label: `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`,
        });
      }
    }

    // If no options were generated (e.g., it's after business hours),
    // show all time options for tomorrow
    if (options.length === 0) {
      return isAdmin ? generateAllHoursOptions() : generateBusinessHoursOptions();
    }

    console.log("Generated options:", options.length);
    return options;

    // Helper function to generate all time options for business hours (9 AM to 11:55 PM)
    function generateBusinessHoursOptions() {
      const allOptions = [];
      for (let hour = 9; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
          const period = hour >= 12 ? "PM" : "AM";
          allOptions.push({
            value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
            label: `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`,
          });
        }
      }
      return allOptions;
    }

    // Helper function to generate all time options for 24 hours (for admins)
    function generateAllHoursOptions() {
      const allOptions = [];
      for (let hour = 0; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
          const period = hour >= 12 ? "PM" : "AM";
          allOptions.push({
            value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
            label: `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`,
          });
        }
      }
      return allOptions;
    }
  }, [formData.date, formData.location, user?.role])

  const handleCategoryChange = (category: string) => {
    if (!category) {
      console.log("Empty category selected, ignoring");
      return;
    }

    console.log("Category selected:", category);
    console.log("Category name:", categoryIdToNameMap.get(category));

    // Update the selected category state
    setSelectedCategory(category);

    // Create a new form data object to avoid stale state issues
    const updatedFormData = {
      ...formData,
      serviceId: "", // Reset service when category changes
    };

    // Update the form data
    setFormData(updatedFormData);

    // Log for debugging
    console.log("Updated category to:", category);
  }

  const handleSubmit = async () => {
    console.log("🚀 NEW VERSION - handleSubmit called - Form data:", formData);

    if (!formData.clientName || !formData.serviceId || !formData.staffId) {
      console.log("❌ Validation failed - Missing fields:", {
        clientName: formData.clientName,
        serviceId: formData.serviceId,
        staffId: formData.staffId
      });
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill out all required fields.",
      })
      return
    }

    // Create appointment date by combining date and time for validation
    const [hours, minutes] = formData.time.split(":").map(Number)
    const appointmentDate = set(formData.date, { hours, minutes })

    // Validate that appointment time is in the future
    const now = new Date()
    if (isBefore(appointmentDate, now)) {
      toast({
        variant: "destructive",
        title: "Invalid appointment time",
        description: "Appointments cannot be scheduled in the past. Please select a future time.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get the selected service details
      const selectedService = services.find((s) => s.id === formData.serviceId)
      const selectedStaff = realStaff.find((s) => s.id === formData.staffId)

      if (!selectedService || !selectedStaff) {
        throw new Error("Service or staff not found")
      }

      // Handle client registration/lookup
      let clientId: string
      let clientToUse: any

      if (!formData.phone) {
        // No phone provided - show error
        toast({
          title: "Phone number required",
          description: "Please provide a phone number to create an appointment.",
          variant: "destructive",
        })
        return
      }

      // ALWAYS use auto-registration flow to ensure client exists in database
      // This handles both new clients and existing clients
      // The autoRegisterClient function will return the existing client if found
      console.log('🔄 Registering/verifying client in database:', {
        name: formData.clientName,
        phone: formData.phone,
        email: formData.email
      })

      const autoRegisteredClient = await autoRegisterClient({
        name: formData.clientName,
        email: formData.email,
        phone: formData.phone,
        source: "appointment_booking",
        preferredLocation: formData.location
      })

      if (!autoRegisteredClient) {
        console.error("❌ Failed to auto-register client")
        toast({
          title: "Failed to create client",
          description: "Unable to register client. Please try again.",
          variant: "destructive",
        })
        return
      }

      clientId = autoRegisteredClient.id
      clientToUse = autoRegisteredClient
      console.log(`✅ Client verified/registered in database: ${autoRegisteredClient.name} (${clientId})`)

      // Create a new appointment object
      const newAppointment = {
        id: `appointment-${Date.now()}`,
        clientId: clientId,
        clientName: formData.clientName,
        staffId: formData.staffId,
        staffName: selectedStaff.name,
        service: selectedService.name,
        serviceId: selectedService.id, // Add service ID for proper validation
        date: appointmentDate.toISOString(),
        duration: selectedService.duration,
        status: "pending",
        location: formData.location,
        notes: formData.notes,
        price: selectedService.price, // Add service price
        additionalServices: [],
        products: [],
      }

      // Validate staff availability across all locations before creating appointment
      console.log("🔍 Validating staff availability for appointment:", newAppointment)
      const availabilityValidation = await validateStaffAvailability(newAppointment)

      if (!availabilityValidation.isValid) {
        console.error("❌ Staff availability validation failed:", availabilityValidation.error)
        toast({
          variant: "destructive",
          title: "Staff unavailable",
          description: availabilityValidation.error || "The selected staff member is not available at this time.",
        })
        setIsSubmitting(false)
        return
      }

      console.log("✅ Staff availability validation passed")

      // Call the callback with the new appointment
      console.log("📞 Calling onAppointmentCreated with:", newAppointment);
      if (onAppointmentCreated) {
        onAppointmentCreated(newAppointment)
      } else {
        console.warn("⚠️ onAppointmentCreated callback is not defined!");
      }

      // Trigger real-time client updates if a client was auto-registered
      if (formData.phone && formData.clientName) {
        window.dispatchEvent(new CustomEvent('refresh-clients'))
      }

      // Create a new form data object for reset
      const resetFormData = {
        clientName: "",
        email: "",
        phone: "",
        serviceId: "",
        date: new Date(),
        time: "10:00",
        staffId: "",
        location: currentLocation === "all" || currentLocation === "home" ? "loc1" : currentLocation,
        notes: "",
      };

      // Reset form data first
      setFormData(resetFormData);

      // Reset client lookup state
      setClientLookupStatus('idle')
      setFoundClient(null)

      // Reset selected category and close dialog
      setSelectedCategory("");
      console.log("Form submitted - reset form data and category");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create appointment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the appointment. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px]"
        onInteractOutside={(e) => {
          // Prevent dialog from closing when clicking on toast notifications
          // or other overlay elements
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Create a new appointment for a client.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone {clientLookupStatus === 'found' && <span className="text-green-600 text-xs ml-2">✓ Client found</span>}
                {clientLookupStatus === 'new' && <span className="text-blue-600 text-xs ml-2">ℹ New client</span>}
              </Label>
              <Input
                id="phone"
                placeholder="(123) 456-7890"
                value={formData.phone}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Phone changed:", newValue);
                  setFormData((prevData) => ({
                    ...prevData,
                    phone: newValue
                  }));
                  // Reset lookup status when phone changes
                  setClientLookupStatus('idle')
                  setFoundClient(null)
                }}
                onBlur={(e) => {
                  // Trigger phone lookup when user leaves the field
                  handlePhoneLookup(e.target.value)
                }}
                className={cn(
                  clientLookupStatus === 'found' && "border-green-500",
                  clientLookupStatus === 'new' && "border-blue-500"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={formData.email}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Email changed:", newValue);
                  setFormData((prevData) => ({
                    ...prevData,
                    email: newValue
                  }));
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                placeholder="Enter client name"
                value={formData.clientName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Client name changed:", newValue);
                  setFormData((prevData) => ({
                    ...prevData,
                    clientName: newValue
                  }));
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceCategory">Service Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
                onOpenChange={(open) => {
                  // Log when the dropdown opens/closes for debugging
                  console.log("Category dropdown open state:", open);
                }}
              >
                <SelectTrigger id="serviceCategory" className="relative">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className={selectedCategory === category.id ? "bg-gray-100" : ""}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <div className="text-xs text-green-600 mt-1">
                  Selected: {categoryIdToNameMap.get(selectedCategory) || selectedCategory}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) => {
                console.log("Service selected:", value);
                if (value === "no-services") {
                  console.log("Ignoring selection of disabled 'no-services' item");
                  return;
                }
                // Create a new form data object to avoid stale state issues
                const updatedFormData = { ...formData, serviceId: value };
                setFormData(updatedFormData);
                console.log("Updated service ID to:", value);
              }}
              disabled={!selectedCategory} // Disable if no category is selected
            >
              <SelectTrigger id="service">
                <SelectValue
                  placeholder={
                    selectedCategory
                      ? `Select a ${categoryIdToNameMap.get(selectedCategory) || selectedCategory} service`
                      : "Select a category first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {!selectedCategory ? (
                  <SelectItem value="no-category" disabled>
                    Please select a category first
                  </SelectItem>
                ) : computedFilteredServices.length > 0 ? (
                  computedFilteredServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - <CurrencyDisplay amount={service.price} showSymbol={true} useLocaleFormat={false} /> ({service.duration} min)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-services" disabled>
                    No services available in this category
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <div className="text-xs text-gray-500 mt-1">
                Showing {computedFilteredServices.length} services in {categoryIdToNameMap.get(selectedCategory) || selectedCategory} category
              </div>
            )}
            {!selectedCategory && (
              <div className="text-xs text-amber-600 mt-1">
                Please select a service category to filter services
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? formatAppDate(formData.date) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        // Create a new form data object with the selected date
                        const updatedFormData = { ...formData, date }

                        // If selecting today, adjust the time to be valid
                        if (isToday(date)) {
                          const now = new Date()
                          const currentHour = now.getHours()
                          const currentMinute = now.getMinutes()

                          // If the current selected time is in the past, update it
                          const [selectedHour, selectedMinute] = formData.time.split(':').map(Number)
                          const selectedTimeIsInPast =
                            (currentHour > selectedHour) ||
                            (currentHour === selectedHour && currentMinute > selectedMinute)

                          if (selectedTimeIsInPast) {
                            // Find the next available 15-minute slot
                            let nextMinute = Math.ceil(currentMinute / 15) * 15
                            let nextHour = currentHour
                            const isAdmin = hasAdminPrivileges(user?.role)
                            // Check for both "loc4" and "home" as valid home service locations
                            const isHomeService = formData.location === "loc4" || formData.location === "home" || currentLocation === "home"

                            // Handle case where rounding up minutes goes to the next hour
                            if (nextMinute >= 60) {
                              nextMinute = 0
                              nextHour += 1
                            }

                            // For admins creating home service appointments, allow any time
                            if (isAdmin && isHomeService) {
                              updatedFormData.time = `${nextHour.toString().padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`
                            }
                            // For regular users or non-home service, enforce business hours (9 AM to 11:55 PM)
                            else if (nextHour >= 9 && nextHour <= 23) {
                              updatedFormData.time = `${nextHour.toString().padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`
                            } else if (nextHour < 9) {
                              updatedFormData.time = "09:00"
                            } else {
                              updatedFormData.time = "09:00" // Next day
                            }

                            console.log("Updated time to:", updatedFormData.time);
                          }
                        }

                        setFormData(updatedFormData)
                      }
                    }}
                    disabled={(date) =>
                      isBefore(date, startOfDay(new Date())) // Disable past dates
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => {
                  // Reset staff selection when location changes to ensure valid staff selection
                  setFormData({ ...formData, location: value, staffId: "" })
                }}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {/* Map through locations from the location provider */}
                  {storeLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}

                  {/* Add Home Service option if enabled - only for admin users */}
                  {isHomeServiceEnabled && !storeLocations.some(loc => loc.id === "home") && user?.role === "ADMIN" && (
                    <SelectItem value="home">Home Service</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Staff</Label>
              <Select value={formData.staffId} onValueChange={(value) => setFormData({ ...formData, staffId: value })}>
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {isStaffLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading staff...
                    </SelectItem>
                  ) : (
                    realStaff
                      .filter((s) => {
                        // First check if staff is active
                        if (s.status !== "Active") return false;

                        // For Home service location, include staff with homeService flag OR staff with "home" in their locations
                        if (formData.location === "loc4" || formData.location === "home") { // loc4 is Home Service
                          return s.homeService === true || (s.locations && s.locations.includes("home"));
                        }

                        // For regular locations, check if staff is assigned to that location
                        return s.locations && s.locations.includes(formData.location);
                      })
                      .map((staff) => {
                        const isUnavailable = unavailableStaff.includes(staff.id);
                        const availabilityStatus = staffAvailability[staff.id];

                        // Get detailed unavailability reason
                        let unavailabilityReason = "Unavailable";
                        if (isUnavailable && availabilityStatus) {
                          if (availabilityStatus.conflicts.length > 0) {
                            const conflict = availabilityStatus.conflicts[0];
                            const locationName = conflict.location === 'home' ? 'Home Service' :
                                                conflict.location === 'loc1' ? 'D-Ring Road' :
                                                conflict.location === 'loc2' ? 'Muaither' :
                                                conflict.location === 'loc3' ? 'Medinat Khalifa' :
                                                conflict.location;
                            const timeStr = format(conflict.startTime, 'h:mm a');
                            unavailabilityReason = `Booked at ${locationName} (${timeStr})`;
                          } else if (availabilityStatus.reason) {
                            unavailabilityReason = availabilityStatus.reason;
                          }
                        }

                        return (
                          <SelectItem
                            key={staff.id}
                            value={staff.id}
                            disabled={isUnavailable}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{getFirstName(staff.name)}</span>
                              {isUnavailable && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200"
                                  title={unavailabilityReason}
                                >
                                  {unavailabilityReason}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                  )}
                </SelectContent>
              </Select>

              {unavailableStaff.length > 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                  <strong>Note:</strong> Some staff members are unavailable at this time due to existing appointments.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes here..."
              value={formData.notes}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log("Notes changed:", newValue);
                setFormData((prevData) => ({
                  ...prevData,
                  notes: newValue
                }));
              }}
              rows={4}
            />
          </div>

          {/* Show warning for admins booking outside business hours */}
          {(user?.role === "super_admin" || (hasAdminPrivileges(user?.role) && (formData.location === "loc4" || formData.location === "home" || currentLocation === "home"))) && (
            <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200 mt-1">
              <strong>Admin Notice:</strong> As a {user?.role?.replace("_", " ")}, you can create appointments outside of regular business hours{user?.role === "super_admin" ? "" : " for home service"}.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-black text-white hover:bg-gray-800">
            {isSubmitting ? "Creating..." : "Create Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

