// Centralized appointment management service
// This service handles all appointment operations and ensures data consistency
// between the client portal and the appointment calendar

import { AppointmentStatus } from '@/lib/types/appointment';
import { realTimeService, RealTimeEventType } from './real-time-service';
import { staffAvailabilityService, checkStaffAvailability } from '@/lib/services/staff-availability';
import { bookingValidationService } from '@/lib/services/booking-validation';
import { appointmentSyncService } from '@/lib/services/appointment-sync';
import { appointmentReflectionService } from '@/lib/services/appointment-reflection';
import { parseISO, addMinutes } from 'date-fns';

// Extend window interface for cleanup tracking
declare global {
  interface Window {
    hasRunReflectionCleanup?: boolean;
  }
}

// Define the appointment interface
export interface AppointmentData {
  id: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  service: string;
  serviceId?: string;
  date: string; // ISO date string
  duration: number; // in minutes
  location: string;
  price?: number;
  notes?: string;
  status: AppointmentStatus | string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy?: string;
  }>;
  type?: string;
  additionalServices?: Array<any>;
  products?: Array<any>;
  createdAt?: string;
  updatedAt?: string;
  // Payment information
  paymentStatus?: "paid" | "unpaid" | "partial";
  paymentMethod?: string;
  paymentDate?: string;
  [key: string]: any; // Allow additional properties
}

// Storage key for localStorage
const STORAGE_KEY = 'vanity_appointments';

// Debug flag - set to true to enable console logging
const DEBUG = true;

// Cache for appointments to avoid excessive API calls
let appointmentsCache: AppointmentData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch appointments from the database via API
 */
async function fetchAppointmentsFromAPI(): Promise<AppointmentData[]> {
  try {
    // Add cache busting parameter to ensure fresh data
    const cacheBuster = `_t=${Date.now()}`;
    const response = await fetch(`/api/appointments?${cacheBuster}`, {
      cache: 'no-store', // Disable Next.js caching
      headers: {
        'Cache-Control': 'no-cache', // Disable browser caching
      }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.appointments || [];
  } catch (error) {
    console.error('AppointmentService: Error fetching from API', error);
    throw error;
  }
}

/**
 * Get all appointments - tries API first, falls back to localStorage
 * This is now the single source of truth for appointment data
 */
export function getAllAppointments(): AppointmentData[] {
  // For server-side rendering, return empty array
  if (typeof window === 'undefined') {
    return [];
  }

  // Check cache first
  const now = Date.now();
  if (appointmentsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    if (DEBUG) console.log('AppointmentService: Using cached appointments', appointmentsCache.length);
    return appointmentsCache;
  }

  // Try to get appointments from localStorage as fallback
  let appointments: AppointmentData[] = [];
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      appointments = JSON.parse(storedData);
      if (DEBUG) console.log('AppointmentService: Loaded from localStorage', appointments.length);
    } else {
      // Initialize with empty array if no data exists
      if (DEBUG) console.log('AppointmentService: No appointments found, starting with empty array');
      appointments = [];
    }
  } catch (error) {
    console.error('AppointmentService: Error loading from localStorage', error);
    appointments = [];
  }

  // Ensure all appointments have booking references
  let hasChanges = false;
  appointments = appointments.map(appointment => {
    if (!appointment.bookingReference) {
      hasChanges = true;
      return {
        ...appointment,
        bookingReference: `VH-${Date.now().toString().slice(-6)}`
      };
    }
    return appointment;
  });

  // Save back if we added any booking references
  if (hasChanges) {
    saveAppointments(appointments);
  }

  // Update cache
  appointmentsCache = appointments;
  cacheTimestamp = now;

  if (DEBUG) console.log('AppointmentService: Retrieved appointments', appointments.length);
  return appointments;
}

/**
 * Get all appointments asynchronously - fetches from API with localStorage fallback
 */
export async function getAllAppointmentsAsync(): Promise<AppointmentData[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    // Try to fetch from API
    const appointments = await fetchAppointmentsFromAPI();

    // Update cache
    appointmentsCache = appointments;
    cacheTimestamp = Date.now();

    // Also update localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));

    if (DEBUG) console.log('AppointmentService: Fetched from API', appointments.length);
    return appointments;
  } catch (error) {
    console.warn('AppointmentService: API fetch failed, using localStorage fallback', error);
    // Fall back to localStorage
    return getAllAppointments();
  }
}

/**
 * Save appointments to localStorage (legacy function)
 */
export function saveAppointments(appointments: AppointmentData[]): void {
  if (DEBUG) console.log('AppointmentService: Saving appointments', appointments.length);

  // Save to localStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
      // Update cache
      appointmentsCache = appointments;
      cacheTimestamp = Date.now();
      if (DEBUG) console.log('AppointmentService: Saved to localStorage');
    }
  } catch (error) {
    console.error('AppointmentService: Error saving to localStorage', error);
  }
}

/**
 * Save a single appointment to the database via API
 */
async function saveAppointmentToAPI(appointment: AppointmentData): Promise<AppointmentData> {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointment),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.appointment;
  } catch (error) {
    console.error('AppointmentService: Error saving to API', error);
    throw error;
  }
}

/**
 * Update an appointment in the database via API
 */
async function updateAppointmentInAPI(appointment: AppointmentData): Promise<AppointmentData> {
  try {
    const response = await fetch('/api/appointments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointment),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.appointment;
  } catch (error) {
    console.error('AppointmentService: Error updating in API', error);
    throw error;
  }
}

/**
 * Delete an appointment from the database via API
 *
 * ⚠️ DEPRECATED: Appointments cannot be deleted, only cancelled
 * This function is disabled to enforce data retention requirements
 */
async function deleteAppointmentFromAPI(appointmentId: string): Promise<void> {
  console.error('🚫 deleteAppointmentFromAPI: Deletion is not allowed. Use cancellation instead.');
  throw new Error('Appointments cannot be deleted. Please cancel the appointment instead by updating its status to "cancelled".');
}

/**
 * Invalidate the appointments cache
 */
export function invalidateAppointmentsCache(): void {
  appointmentsCache = null;
  cacheTimestamp = 0;
}

/**
 * Validate staff availability before creating/updating an appointment
 * Includes bidirectional blocking between home service and physical locations
 * Uses comprehensive booking validation with detailed error messages
 */
export async function validateStaffAvailability(
  appointment: AppointmentData,
  excludeAppointmentId?: string
): Promise<{ isValid: boolean; error?: string; conflicts?: any[]; warnings?: string[] }> {
  try {
    // Use the comprehensive booking validation service
    const validationResult = await bookingValidationService.validateBooking({
      staffId: appointment.staffId,
      date: appointment.date,
      duration: appointment.duration,
      location: appointment.location,
      clientName: appointment.clientName,
      service: appointment.service,
      excludeAppointmentId
    });

    if (!validationResult.isValid) {
      // Return the first error message (most relevant)
      const primaryError = validationResult.errors[0] || 'Staff member is not available for this time slot';

      return {
        isValid: false,
        error: primaryError,
        conflicts: validationResult.conflicts,
        warnings: validationResult.warnings
      };
    }

    return {
      isValid: true,
      warnings: validationResult.warnings
    };
  } catch (error) {
    console.error('Error validating staff availability:', error);
    return {
      isValid: false,
      error: 'Unable to validate staff availability'
    };
  }
}

/**
 * Add a new appointment with availability validation
 */
export async function addAppointmentWithValidation(appointment: AppointmentData): Promise<{ success: boolean; appointment?: AppointmentData; error?: string }> {
  console.log('🔍 addAppointmentWithValidation called with:', appointment);
  console.log('🔍 Appointment fields:', {
    clientId: appointment.clientId,
    staffId: appointment.staffId,
    location: appointment.location,
    date: appointment.date,
    duration: appointment.duration,
    price: appointment.price
  });

  // Validate staff availability across all locations
  const validation = await validateStaffAvailability(appointment);

  if (!validation.isValid) {
    const errorMessage = validation.error || 'Staff member is not available for this time slot';
    console.error('❌ Staff availability validation failed:', errorMessage);
    console.error('❌ Validation details:', validation);
    return {
      success: false,
      error: errorMessage
    };
  }

  // IMPORTANT: Save to database via API first
  try {
    // Normalize status to uppercase for Prisma schema compatibility
    const normalizeStatus = (status?: string): string => {
      if (!status) return 'PENDING';
      const upperStatus = status.toUpperCase();
      // Map common status values to Prisma enum values
      const statusMap: Record<string, string> = {
        'PENDING': 'PENDING',
        'CONFIRMED': 'CONFIRMED',
        'SCHEDULED': 'PENDING', // Map SCHEDULED to PENDING
        'IN_PROGRESS': 'IN_PROGRESS',
        'SERVICE-STARTED': 'IN_PROGRESS', // Map service-started to IN_PROGRESS
        'COMPLETED': 'COMPLETED',
        'CANCELLED': 'CANCELLED',
        'NO_SHOW': 'NO_SHOW',
        'ARRIVED': 'ARRIVED', // ✅ Keep ARRIVED as distinct status
        'CHECKED-IN': 'ARRIVED', // Map checked-in to ARRIVED
      };
      return statusMap[upperStatus] || 'PENDING';
    };

    // Prepare services array for API
    // If additionalServices is provided and not empty, use it
    // Otherwise, create a service entry from the main service fields
    let servicesArray = appointment.additionalServices || [];

    if (servicesArray.length === 0 && appointment.serviceId) {
      // Create a service entry from the main service fields
      servicesArray = [{
        serviceId: appointment.serviceId,
        price: appointment.price || 0,
        duration: appointment.duration || 0,
      }];
      console.log('📋 Created services array from main service:', servicesArray);
    }

    const apiPayload = {
      clientId: appointment.clientId,
      staffId: appointment.staffId,
      locationId: appointment.location,
      date: appointment.date,
      duration: appointment.duration,
      totalPrice: appointment.price || 0,
      notes: appointment.notes || '',
      status: normalizeStatus(appointment.status),
      bookingReference: appointment.bookingReference,
      services: servicesArray,
      products: appointment.products || [],
    };

    console.log('📤 Sending appointment to database API:', apiPayload);
    console.log('📋 Original appointment object:', appointment);

    // Validate required fields before sending
    if (!apiPayload.clientId || !apiPayload.staffId || !apiPayload.locationId || !apiPayload.date || !apiPayload.duration) {
      console.error('❌ Missing required fields in appointment:', {
        clientId: apiPayload.clientId,
        staffId: apiPayload.staffId,
        locationId: apiPayload.locationId,
        date: apiPayload.date,
        duration: apiPayload.duration
      });
      return {
        success: false,
        error: `Missing required fields: ${!apiPayload.clientId ? 'clientId ' : ''}${!apiPayload.staffId ? 'staffId ' : ''}${!apiPayload.locationId ? 'locationId ' : ''}${!apiPayload.date ? 'date ' : ''}${!apiPayload.duration ? 'duration' : ''}`
      };
    }

    console.log('📋 Sending appointment to API:', JSON.stringify(apiPayload, null, 2));
    console.log('📋 Services array being sent:', JSON.stringify(apiPayload.services, null, 2));
    console.log('📋 Products array being sent:', JSON.stringify(apiPayload.products, null, 2));

    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      let errorData;
      let responseText = '';
      try {
        responseText = await response.text();
        console.error('❌ Raw error response:', responseText);
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse error response:', e);
        errorData = {
          error: 'Failed to parse error response',
          status: response.status,
          statusText: response.statusText,
          rawResponse: responseText
        };
      }
      console.error('❌ Failed to save appointment to database:', errorData);
      console.error('❌ Response status:', response.status, response.statusText);
      console.error('❌ Payload that was sent:', JSON.stringify(apiPayload, null, 2));

      // Return error instead of falling back to localStorage
      // This ensures the user knows there's an issue
      const errorMessage = errorData?.error || errorData?.details || errorData?.message || `API error: ${response.status} ${response.statusText}`;
      const errorDetails = errorData?.debug || errorData?.details || '';

      return {
        success: false,
        error: `${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}${errorDetails ? '\n' + (typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)) : ''}`
      };
    }

    const result = await response.json();
    const dbAppointment = result.appointment;

    console.log('✅ Appointment saved to database:', dbAppointment.id);

    // Also save to localStorage as cache
    const createdAppointment = addAppointment(appointment);

    // Create reflected appointments for staff with home service capability
    try {
      await appointmentReflectionService.createReflectedAppointments(createdAppointment);
    } catch (error) {
      console.error('Error creating reflected appointments:', error);
      // Don't fail the main appointment creation if reflection fails
    }

    return {
      success: true,
      appointment: createdAppointment
    };
  } catch (error) {
    console.error('❌ Error saving appointment to database:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    // Return error instead of falling back to localStorage
    const errorMessage = error instanceof Error ? error.message : 'Failed to save appointment to database';
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Add a new appointment (legacy function - consider using addAppointmentWithValidation)
 */
export function addAppointment(appointment: AppointmentData): AppointmentData {
  if (DEBUG) console.log('AppointmentService: Adding appointment', appointment);

  // Generate booking reference if not provided
  if (!appointment.bookingReference) {
    appointment.bookingReference = `VH-${Date.now().toString().slice(-6)}`;
  }

  // Get all existing appointments
  const allAppointments = getAllAppointments();

  // Check if appointment with this ID already exists
  const existingIndex = allAppointments.findIndex(a => a.id === appointment.id);

  if (existingIndex >= 0) {
    // Update existing appointment
    allAppointments[existingIndex] = appointment;
    if (DEBUG) console.log('AppointmentService: Updated existing appointment');
  } else {
    // Add new appointment
    allAppointments.push(appointment);
    if (DEBUG) console.log('AppointmentService: Added new appointment');
  }

  // Save appointments to all storage locations
  saveAppointments(allAppointments);

  // IMPORTANT: Invalidate cache to force fresh fetch on next read
  // This ensures the calendar sees the new appointment immediately
  appointmentsCache = null;
  cacheTimestamp = 0;
  if (DEBUG) console.log('AppointmentService: Cache invalidated after adding appointment');

  // Emit real-time event for appointment creation
  if (existingIndex < 0) {
    realTimeService.emitEvent(RealTimeEventType.APPOINTMENT_CREATED, {
      appointment,
      clientName: appointment.clientName,
      staffName: appointment.staffName,
      service: appointment.service,
      date: appointment.date
    }, {
      source: 'AppointmentService',
      userId: appointment.staffId,
      locationId: appointment.location
    });

    // Emit appointment sync event for cross-location availability updates
    appointmentSyncService.emitAppointmentCreated(
      appointment.id,
      appointment.staffId,
      appointment.location,
      {
        appointment,
        duration: appointment.duration,
        date: appointment.date
      }
    );
  }

  return appointment;
}

/**
 * Update an existing appointment with availability validation
 */
export async function updateAppointmentWithValidation(
  appointmentId: string,
  updates: Partial<AppointmentData>
): Promise<{ success: boolean; appointment?: AppointmentData; error?: string }> {
  // If the update includes staff, date, or duration changes, validate availability
  if (updates.staffId || updates.date || updates.duration) {
    const currentAppointment = getAppointmentById(appointmentId);
    if (!currentAppointment) {
      return {
        success: false,
        error: 'Appointment not found'
      };
    }

    // Create the updated appointment data for validation
    const updatedAppointmentData = {
      ...currentAppointment,
      ...updates
    };

    // Validate staff availability (excluding the current appointment)
    const validation = await validateStaffAvailability(updatedAppointmentData, appointmentId);

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }
  }

  // If validation passes, update the appointment
  const updatedAppointment = await updateAppointment(appointmentId, updates);

  if (!updatedAppointment) {
    return {
      success: false,
      error: 'Failed to update appointment'
    };
  }

  return {
    success: true,
    appointment: updatedAppointment
  };
}

/**
 * Update an existing appointment (legacy function - consider using updateAppointmentWithValidation)
 */
export async function updateAppointment(appointmentId: string, updates: Partial<AppointmentData>): Promise<AppointmentData | null> {
  if (DEBUG) console.log('AppointmentService: Updating appointment', appointmentId, updates);

  // Get all existing appointments
  const allAppointments = getAllAppointments();

  // Find the appointment to update
  const appointmentIndex = allAppointments.findIndex(a => a.id === appointmentId);

  if (appointmentIndex >= 0) {
    // Update the appointment
    const updatedAppointment = {
      ...allAppointments[appointmentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // IMPORTANT: Save to database via API first
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: appointmentId,
          ...updates,
        }),
      });

      if (response.ok) {
        console.log('✅ Appointment updated in database:', appointmentId);
      } else {
        console.warn('⚠️ Failed to update appointment in database, updating localStorage only');
      }
    } catch (error) {
      console.error('Error updating appointment in database:', error);
      console.warn('⚠️ Updating localStorage only due to database error');
    }

    // Update in localStorage
    allAppointments[appointmentIndex] = updatedAppointment;

    // Save appointments to all storage locations
    saveAppointments(allAppointments);

    // IMPORTANT: Invalidate cache to force fresh fetch on next read
    appointmentsCache = null;
    cacheTimestamp = 0;
    if (DEBUG) console.log('AppointmentService: Cache invalidated after updating appointment');

    // Emit real-time event for appointment update
    const eventType = updates.status ? RealTimeEventType.APPOINTMENT_STATUS_CHANGED : RealTimeEventType.APPOINTMENT_UPDATED;
    realTimeService.emitEvent(eventType, {
      appointment: updatedAppointment,
      updates,
      previousStatus: allAppointments[appointmentIndex].status,
      newStatus: updatedAppointment.status
    }, {
      source: 'AppointmentService',
      userId: updatedAppointment.staffId,
      locationId: updatedAppointment.location
    });

    // Emit appointment sync event for cross-location availability updates
    appointmentSyncService.emitAppointmentUpdated(
      updatedAppointment.id,
      updatedAppointment.staffId,
      updatedAppointment.location,
      {
        appointment: updatedAppointment,
        updates,
        duration: updatedAppointment.duration,
        date: updatedAppointment.date
      }
    );

    // Update reflected appointments if this is not a reflected appointment
    if (!updatedAppointment.isReflected) {
      try {
        await appointmentReflectionService.updateReflectedAppointments(updatedAppointment);
      } catch (error) {
        console.error('Error updating reflected appointments:', error);
        // Don't fail the main appointment update if reflection update fails
      }
    }

    if (DEBUG) console.log('AppointmentService: Appointment updated successfully');
    return updatedAppointment;
  }

  if (DEBUG) console.log('AppointmentService: Appointment not found for update');
  return null;
}

/**
 * Delete an appointment
 *
 * ⚠️ DEPRECATED: Appointments cannot be deleted, only cancelled
 * This function is disabled to enforce data retention and audit trail requirements
 *
 * @throws Error Always throws an error indicating deletion is not allowed
 */
export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  console.error('🚫 deleteAppointment: Deletion attempt blocked for appointment:', appointmentId);
  console.error('🚫 Appointments cannot be deleted. Please cancel the appointment instead.');

  throw new Error(
    'Appointments cannot be deleted. Please cancel the appointment instead by updating its status to "cancelled". ' +
    'This restriction ensures data retention and maintains a complete audit trail of all appointments.'
  );
}

/**
 * Get appointment by ID
 */
export function getAppointmentById(appointmentId: string): AppointmentData | null {
  // Get all existing appointments
  const allAppointments = getAllAppointments();

  // Find the appointment
  const appointment = allAppointments.find(a => a.id === appointmentId);

  return appointment || null;
}

/**
 * Initialize the appointment service
 * This ensures that all storage locations are in sync
 */
export function initializeAppointmentService(): void {
  if (DEBUG) console.log('AppointmentService: Initializing');

  // Get all appointments and save them back to ensure consistency
  const allAppointments = getAllAppointments();
  saveAppointments(allAppointments);

  if (DEBUG) console.log('AppointmentService: Initialized with', allAppointments.length, 'appointments');
}

/**
 * Clear all appointments (for testing purposes)
 */
export function clearAllAppointments(): void {
  if (DEBUG) console.log('AppointmentService: Clearing all appointments');

  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }

  if (DEBUG) console.log('AppointmentService: All appointments cleared');
}
