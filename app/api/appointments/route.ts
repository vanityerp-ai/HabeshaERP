import { NextRequest, NextResponse } from "next/server";
import { getAllAppointments, saveAppointments } from "@/lib/appointment-service";
import { getUserFromHeaders, filterAppointmentsByLocationAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/appointments
 *
 * Get all appointments with location-based access control
 * Now fetches from database with localStorage fallback
 */
export async function GET(request: NextRequest) {
  try {
    // Get user information from headers (set by middleware)
    const currentUser = getUserFromHeaders(request);

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const staffId = searchParams.get("staffId");
    const clientId = searchParams.get("clientId");
    const date = searchParams.get("date");

    // Try to get appointments from database first
    let filteredAppointments: any[] = [];

    try {
      // Build where clause for database query
      const where: any = {};

      // Apply location-based access control
      if (currentUser && currentUser.locations.length > 0 && !currentUser.locations.includes("all")) {
        where.locationId = { in: currentUser.locations };
      }

      if (locationId) where.locationId = locationId;
      if (staffId) where.staffId = staffId;
      if (clientId) where.clientId = clientId;
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.date = {
          gte: targetDate,
          lt: nextDay,
        };
      }

      // Fetch from database
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
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Transform database appointments to match the expected format
      filteredAppointments = dbAppointments.map(apt => ({
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
        status: apt.status,
        bookingReference: apt.bookingReference || '',
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      }));

      console.log("API: Retrieved appointments from database", filteredAppointments.length);
    } catch (dbError) {
      console.error("API: Database query failed, falling back to localStorage", dbError);

      // Fallback to localStorage
      filteredAppointments = getAllAppointments();
      console.log("API: Retrieved all appointments from localStorage", filteredAppointments.length);

      // Apply location-based access control FIRST
      if (currentUser && currentUser.locations.length > 0) {
        filteredAppointments = filterAppointmentsByLocationAccess(filteredAppointments, currentUser.locations);
        console.log(`🔒 Filtered appointments by user location access: ${filteredAppointments.length} appointments visible to user`);
      }

      // Apply additional filters
      if (locationId) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.location === locationId
        );
      }

      if (staffId) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.staffId === staffId
        );
      }

      if (clientId) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.clientId === clientId
        );
      }

      if (date) {
        const targetDate = new Date(date).toDateString();
        filteredAppointments = filteredAppointments.filter(
          appointment => new Date(appointment.date).toDateString() === targetDate
        );
      }
    }

    console.log(`API: Final filtered appointments: ${filteredAppointments.length}`);

    return NextResponse.json({
      appointments: filteredAppointments,
      total: filteredAppointments.length
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

/**
 * POST /api/appointments
 *
 * Create a new appointment in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      staffId,
      locationId,
      date,
      duration,
      totalPrice,
      notes,
      status = "SCHEDULED",
      bookingReference,
      services = [],
      products = [],
    } = body;

    // Validate required fields
    if (!clientId || !staffId || !locationId || !date || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create appointment in database
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId,
        locationId,
        date: new Date(date),
        duration,
        totalPrice: totalPrice || 0,
        notes,
        status,
        bookingReference: bookingReference || `VH-${Date.now().toString().slice(-6)}`,
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

    // Also save to localStorage for backward compatibility
    const appointments = getAllAppointments();
    const newAppointment = {
      id: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.client?.name || '',
      staffId: appointment.staffId,
      staffName: appointment.staff?.name || '',
      service: services[0]?.name || '',
      serviceId: services[0]?.id || '',
      date: appointment.date.toISOString(),
      duration: appointment.duration,
      location: appointment.locationId,
      price: appointment.totalPrice ? parseFloat(appointment.totalPrice.toString()) : 0,
      notes: appointment.notes || '',
      status: appointment.status,
      bookingReference: appointment.bookingReference || '',
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
    appointments.push(newAppointment);
    saveAppointments(appointments);

    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

/**
 * PUT /api/appointments
 *
 * Update an appointment in the database
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    // Convert date string to Date object if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    // Update in database
    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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

    // Also update in localStorage for backward compatibility
    const appointments = getAllAppointments();
    const index = appointments.findIndex(apt => apt.id === id);
    if (index !== -1) {
      appointments[index] = {
        ...appointments[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      saveAppointments(appointments);
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

/**
 * DELETE /api/appointments
 *
 * Delete an appointment from the database
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    // Delete from database
    await prisma.appointment.delete({
      where: { id },
    });

    // Also delete from localStorage for backward compatibility
    const appointments = getAllAppointments();
    const filteredAppointments = appointments.filter(apt => apt.id !== id);
    saveAppointments(filteredAppointments);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}
