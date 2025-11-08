import { NextRequest, NextResponse } from "next/server";
import { appointments, createAppointment, Appointment } from "@/lib/appointments-data";
import { parseISO, isBefore, isAfter, addMinutes } from "date-fns";
import { addAppointment, getAllAppointments } from "@/lib/appointment-service";
import { getUserFromHeaders, filterAppointmentsByLocationAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

// Get all appointments or filter by client
export async function GET(request: NextRequest) {
  try {
    // Get user information from headers (set by middleware)
    const currentUser = getUserFromHeaders(request);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const staffId = searchParams.get("staffId");
    const location = searchParams.get("location");
    const date = searchParams.get("date");

    // Try to fetch from database first
    try {
      const where: any = {};

      // Apply location-based access control
      if (currentUser && currentUser.locations.length > 0 && !currentUser.locations.includes("all")) {
        where.locationId = { in: currentUser.locations };
      }

      if (clientId) where.clientId = clientId;
      if (staffId) where.staffId = staffId;
      if (location) where.locationId = location;
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.date = {
          gte: targetDate,
          lt: nextDay,
        };
      }

      const dbAppointments = await prisma.appointment.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      const filteredAppointments = dbAppointments.map(apt => ({
        id: apt.id,
        clientId: apt.clientId,
        clientName: apt.client?.name || '',
        staffId: apt.staffId,
        staffName: apt.staff?.name || '',
        service: apt.services[0]?.service?.name || '',
        serviceId: apt.services[0]?.serviceId || '',
        date: apt.date.toISOString(),
        duration: apt.duration,
        location: apt.locationId,
        price: apt.totalPrice ? parseFloat(apt.totalPrice.toString()) : 0,
        notes: apt.notes || '',
        status: apt.status.toLowerCase(),
        bookingReference: apt.bookingReference || '',
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      }));

      console.log("API: Retrieved appointments from database", filteredAppointments.length);
      return NextResponse.json({ appointments: filteredAppointments });
    } catch (dbError) {
      console.error("Database query failed, falling back to localStorage:", dbError);

      // Fallback to localStorage
      let filteredAppointments = getAllAppointments();
      console.log("API: Retrieved all appointments from localStorage", filteredAppointments.length);

      // Apply location-based access control
      if (currentUser && currentUser.locations.length > 0) {
        filteredAppointments = filterAppointmentsByLocationAccess(filteredAppointments, currentUser.locations);
        console.log(`🔒 Filtered appointments by user location access: ${filteredAppointments.length} appointments visible to user`);
      }

      if (clientId) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.clientId === clientId
        );
      }

      if (staffId) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.staffId === staffId
        );
      }

      if (location) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.location === location
        );
      }

      if (date) {
        const targetDate = parseISO(date);
        filteredAppointments = filteredAppointments.filter(appointment => {
          const appointmentDate = parseISO(appointment.date);
          return (
            appointmentDate.getFullYear() === targetDate.getFullYear() &&
            appointmentDate.getMonth() === targetDate.getMonth() &&
            appointmentDate.getDate() === targetDate.getDate()
          );
        });
      }

      return NextResponse.json({ appointments: filteredAppointments });
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

// Book a new appointment
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.clientId || !data.staffId || !data.service || !data.date || !data.duration || !data.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate appointment date is in the future
    const appointmentDate = parseISO(data.date);
    if (isBefore(appointmentDate, new Date())) {
      return NextResponse.json({ error: "Appointment date must be in the future" }, { status: 400 });
    }

    // Check for scheduling conflicts
    const appointmentEnd = addMinutes(appointmentDate, data.duration);
    const conflictingAppointments = appointments.filter(appointment => {
      // Only check appointments for the same staff and location
      if (appointment.staffId !== data.staffId || appointment.location !== data.location) {
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

      const existingStart = parseISO(appointment.date);
      const existingEnd = addMinutes(existingStart, appointment.duration);

      // Check if the new appointment overlaps with an existing one
      return (
        (isAfter(appointmentDate, existingStart) && isBefore(appointmentDate, existingEnd)) ||
        (isAfter(appointmentEnd, existingStart) && isBefore(appointmentEnd, existingEnd)) ||
        (isBefore(appointmentDate, existingStart) && isAfter(appointmentEnd, existingEnd)) ||
        (appointmentDate.getTime() === existingStart.getTime())
      );
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({
        error: "This time slot is already booked",
        conflicts: conflictingAppointments
      }, { status: 409 });
    }

    // Generate a simple booking reference number
    const generateBookingReference = () => {
      // Format: VH-XXXXXX where XXXXXX is a 6-digit number based on timestamp
      return `VH-${Date.now().toString().slice(-6)}`;
    };

    const bookingReference = generateBookingReference();

    // Save to database first
    try {
      const dbAppointment = await prisma.appointment.create({
        data: {
          clientId: data.clientId,
          staffId: data.staffId,
          locationId: data.location,
          date: new Date(data.date),
          duration: data.duration,
          totalPrice: data.price || 0,
          notes: data.notes || '',
          status: data.status || "SCHEDULED",
          bookingReference: bookingReference,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log("✅ Appointment saved to database:", dbAppointment.id);

      // Create the appointment object for response
      const newAppointment = {
        id: dbAppointment.id,
        bookingReference: dbAppointment.bookingReference,
        clientId: dbAppointment.clientId,
        clientName: dbAppointment.client?.name || data.clientName,
        staffId: dbAppointment.staffId,
        staffName: dbAppointment.staff?.name || data.staffName,
        service: data.service,
        serviceId: data.serviceId,
        date: dbAppointment.date.toISOString(),
        duration: dbAppointment.duration,
        location: dbAppointment.locationId,
        price: dbAppointment.totalPrice ? parseFloat(dbAppointment.totalPrice.toString()) : 0,
        notes: dbAppointment.notes || '',
        status: dbAppointment.status.toLowerCase(),
        statusHistory: data.statusHistory || [
          {
            status: "pending",
            timestamp: new Date().toISOString(),
            updatedBy: "Client Portal"
          }
        ],
        type: data.type || "appointment",
        additionalServices: data.additionalServices || [],
        products: data.products || [],
        // Mark this appointment as coming from client portal
        source: 'client_portal',
        bookedVia: 'client_portal',
        metadata: {
          source: 'client_portal',
          bookedVia: 'client_portal',
          isClientPortalBooking: true
        },
        createdAt: dbAppointment.createdAt.toISOString(),
        updatedAt: dbAppointment.updatedAt.toISOString()
      };

      // Add to the appointments array for backward compatibility
      appointments.push(newAppointment);

      // Also add to localStorage via appointment service (for client-side cache)
      try {
        addAppointment(newAppointment);
        console.log("API: Added appointment to localStorage cache", newAppointment.id);
      } catch (error) {
        console.error("Error adding to localStorage cache:", error);
      }

      return NextResponse.json({
        success: true,
        appointment: newAppointment
      });
    } catch (dbError) {
      console.error("Database error creating appointment:", dbError);

      // Fallback to old method if database fails
      const newAppointment = {
        id: `a${Date.now()}`,
        bookingReference: bookingReference,
        clientId: data.clientId,
        clientName: data.clientName,
        staffId: data.staffId,
        staffName: data.staffName,
        service: data.service,
        serviceId: data.serviceId,
        date: data.date,
        duration: data.duration,
        location: data.location,
        price: data.price,
        notes: data.notes,
        status: data.status || "pending",
        statusHistory: data.statusHistory || [
          {
            status: "pending",
            timestamp: new Date().toISOString(),
            updatedBy: "Client Portal"
          }
        ],
        type: data.type || "appointment",
        additionalServices: data.additionalServices || [],
        products: data.products || [],
        source: 'client_portal',
        bookedVia: 'client_portal',
        metadata: {
          source: 'client_portal',
          bookedVia: 'client_portal',
          isClientPortalBooking: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      appointments.push(newAppointment);
      addAppointment(newAppointment);

      console.warn("⚠️ Appointment saved to localStorage only (database failed)");

      return NextResponse.json({
        success: true,
        appointment: newAppointment
      });
    }
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
