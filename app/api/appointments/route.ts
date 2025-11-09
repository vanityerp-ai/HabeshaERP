import { NextRequest, NextResponse } from "next/server";
import { getAllAppointments, saveAppointments } from "@/lib/appointment-service";
import { getUserFromHeaders, filterAppointmentsByLocationAccess } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

// Disable caching for this route to ensure fresh appointment data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Bidirectional status mapping between frontend and database
 *
 * Frontend statuses: pending, confirmed, arrived, service-started, completed, cancelled, no-show
 * Database statuses: PENDING, CONFIRMED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
 *
 * IMPORTANT: Each status is stored distinctly in the database to prevent status reversions
 * IMPORTANT: "service-started" maps to IN_PROGRESS in the database
 */

// Convert frontend status to database status (for saving)
function frontendToDbStatus(frontendStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'confirmed': 'CONFIRMED',
    'arrived': 'ARRIVED', // ✅ Store ARRIVED as distinct status
    'service-started': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
    'no-show': 'NO_SHOW',
    // Also handle uppercase versions
    'PENDING': 'PENDING',
    'CONFIRMED': 'CONFIRMED',
    'ARRIVED': 'ARRIVED',
    'SERVICE-STARTED': 'IN_PROGRESS',
    'IN_PROGRESS': 'IN_PROGRESS',
    'IN-PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'NO_SHOW': 'NO_SHOW',
    'NO-SHOW': 'NO_SHOW',
    // Legacy mappings
    'SCHEDULED': 'PENDING',
    'CHECKED-IN': 'ARRIVED', // Map checked-in to ARRIVED
  };

  const mapped = statusMap[frontendStatus] || statusMap[frontendStatus.toUpperCase()];
  if (!mapped) {
    console.warn(`⚠️ Unknown status "${frontendStatus}", defaulting to PENDING`);
    return 'PENDING';
  }
  return mapped;
}

// Convert database status to frontend status (for display)
function dbToFrontendStatus(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'ARRIVED': 'arrived', // ✅ ARRIVED maps back to arrived
    'IN_PROGRESS': 'service-started', // IN_PROGRESS maps to service-started for frontend
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'NO_SHOW': 'no-show',
  };

  const mapped = statusMap[dbStatus.toUpperCase()];
  if (!mapped) {
    console.warn(`⚠️ Unknown database status "${dbStatus}", defaulting to pending`);
    return 'pending';
  }
  return mapped;
}

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
              email: true,
              clientProfile: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
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
      filteredAppointments = dbAppointments.map(apt => {
        // Convert database status to frontend status using proper mapping
        const frontendStatus = dbToFrontendStatus(apt.status);

        console.log(`🔄 Status conversion: DB "${apt.status}" → Frontend "${frontendStatus}"`);

        // Parse statusHistory from database (stored as JSON string)
        let statusHistory;
        try {
          statusHistory = apt.statusHistory ? JSON.parse(apt.statusHistory) : [];
        } catch (error) {
          console.error('Error parsing statusHistory:', error);
          statusHistory = [];
        }

        // If statusHistory is empty, initialize it with the current status
        if (statusHistory.length === 0) {
          statusHistory = [
            {
              status: 'pending',
              timestamp: apt.createdAt.toISOString(),
              updatedBy: 'System'
            }
          ];

          // If the current status is not pending, add it to the history
          if (frontendStatus !== 'pending') {
            statusHistory.push({
              status: frontendStatus,
              timestamp: apt.updatedAt.toISOString(),
              updatedBy: 'Staff'
            });
          }
        }

        // Map services array to additionalServices format
        const additionalServices = apt.services.map((svc, index) => ({
          id: svc.id,
          name: svc.service?.name || '',
          price: svc.price ? parseFloat(svc.price.toString()) : 0,
          duration: svc.duration || 0,
          serviceId: svc.serviceId,
        }));

        // Map products array
        const products = apt.products.map((prod) => ({
          id: prod.id,
          name: prod.product?.name || '',
          price: prod.price ? parseFloat(prod.price.toString()) : 0,
          quantity: prod.quantity || 1,
          productId: prod.productId,
        }));

        return {
          id: apt.id,
          clientId: apt.clientId,
          clientName: apt.client?.clientProfile?.name || '',
          clientEmail: apt.client?.email || '',
          clientPhone: apt.client?.clientProfile?.phone || '',
          staffId: apt.staffId,
          staffName: apt.staff?.name || '',
          service: apt.services[0]?.service?.name || '',
          serviceId: apt.services[0]?.serviceId || '',
          date: apt.date.toISOString(),
          duration: apt.duration,
          location: apt.locationId,
          price: apt.totalPrice ? parseFloat(apt.totalPrice.toString()) : 0,
          notes: apt.notes || '',
          status: frontendStatus,
          statusHistory,
          bookingReference: apt.bookingReference || '',
          createdAt: apt.createdAt.toISOString(),
          updatedAt: apt.updatedAt.toISOString(),
          // Include all services and products
          additionalServices,
          products,
        };
      });

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

    // CRITICAL: Add cache control headers to prevent stale data
    const response = NextResponse.json({
      appointments: filteredAppointments,
      total: filteredAppointments.length
    });

    // Disable all caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
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
    console.log('📥 POST /api/appointments - Received body:', JSON.stringify(body, null, 2));

    const {
      clientId,
      staffId,
      locationId,
      date,
      duration,
      totalPrice,
      notes,
      status = "PENDING",
      bookingReference,
      services = [],
      products = [],
    } = body;

    // Validate required fields
    if (!clientId || !staffId || !locationId || !date || !duration) {
      console.error('❌ Missing required fields:', { clientId, staffId, locationId, date, duration });
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            clientId: !!clientId,
            staffId: !!staffId,
            locationId: !!locationId,
            date: !!date,
            duration: !!duration
          }
        },
        { status: 400 }
      );
    }

    // Normalize status to uppercase for Prisma schema compatibility
    const normalizeStatus = (status: string): string => {
      const upperStatus = status.toUpperCase();
      // Valid Prisma enum values: PENDING, CONFIRMED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
      const validStatuses = ['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

      // Map common status values to Prisma enum values
      const statusMap: Record<string, string> = {
        'SCHEDULED': 'PENDING',
        'SERVICE-STARTED': 'IN_PROGRESS',
        'CHECKED-IN': 'ARRIVED',
      };

      const mappedStatus = statusMap[upperStatus] || upperStatus;
      return validStatuses.includes(mappedStatus) ? mappedStatus : 'PENDING';
    };

    const normalizedStatus = normalizeStatus(status);

    // Validate that the referenced records exist
    console.log('🔍 Validating foreign key references...');

    // Check if client exists
    const clientExists = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true }
    });

    if (!clientExists) {
      console.error('❌ Client not found:', clientId);
      return NextResponse.json({
        error: "Client not found",
        details: `Client with ID ${clientId} does not exist`
      }, { status: 400 });
    }

    // Check if staff exists
    const staffExists = await prisma.staffMember.findUnique({
      where: { id: staffId },
      select: { id: true }
    });

    if (!staffExists) {
      console.error('❌ Staff member not found:', staffId);
      return NextResponse.json({
        error: "Staff member not found",
        details: `Staff member with ID ${staffId} does not exist`
      }, { status: 400 });
    }

    // Check if location exists
    const locationExists = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true }
    });

    if (!locationExists) {
      console.error('❌ Location not found:', locationId);
      return NextResponse.json({
        error: "Location not found",
        details: `Location with ID ${locationId} does not exist. Please select a valid location.`
      }, { status: 400 });
    }

    console.log('✅ All foreign key references validated');

    // Validate services if provided
    if (services && services.length > 0) {
      console.log('🔍 Validating services...');
      for (const service of services) {
        if (service.serviceId) {
          const serviceExists = await prisma.service.findUnique({
            where: { id: service.serviceId },
            select: { id: true }
          });
          if (!serviceExists) {
            console.error('❌ Service not found:', service.serviceId);
            return NextResponse.json({
              error: "Service not found",
              details: `Service with ID ${service.serviceId} does not exist`
            }, { status: 400 });
          }
        }
      }
      console.log('✅ All services validated');
    }

    // Validate products if provided
    if (products && products.length > 0) {
      console.log('🔍 Validating products...');
      for (const product of products) {
        if (product.productId) {
          const productExists = await prisma.product.findUnique({
            where: { id: product.productId },
            select: { id: true }
          });
          if (!productExists) {
            console.error('❌ Product not found:', product.productId);
            return NextResponse.json({
              error: "Product not found",
              details: `Product with ID ${product.productId} does not exist`
            }, { status: 400 });
          }
        }
      }
      console.log('✅ All products validated');
    }

    // Create appointment in database
    console.log('📝 Creating appointment with data:', {
      clientId,
      staffId,
      locationId,
      date: new Date(date),
      duration,
      totalPrice: totalPrice || 0,
      notes: notes || undefined,
      status: normalizedStatus,
      bookingReference: bookingReference || `VH-${Date.now().toString().slice(-6)}`,
      servicesCount: services?.length || 0,
      productsCount: products?.length || 0,
    });

    // Initialize status history
    const initialStatusHistory = [
      {
        status: dbToFrontendStatus(normalizedStatus),
        timestamp: new Date().toISOString(),
        updatedBy: 'System'
      }
    ];

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId,
        locationId,
        date: new Date(date),
        duration,
        totalPrice: totalPrice || 0,
        notes: notes || undefined,
        status: normalizedStatus,
        statusHistory: JSON.stringify(initialStatusHistory),
        bookingReference: bookingReference || `VH-${Date.now().toString().slice(-6)}`,
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            clientProfile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
              },
            },
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
    });

    console.log('✅ Appointment created in database:', appointment.id);

    // Create service records if provided
    if (services && services.length > 0) {
      console.log('📝 Creating service records...');
      for (const service of services) {
        if (service.serviceId) {
          await prisma.appointmentService.create({
            data: {
              appointmentId: appointment.id,
              serviceId: service.serviceId,
              price: service.price || 0,
              duration: service.duration || 0,
            },
          });
        }
      }
      console.log('✅ Service records created');
    }

    // Create product records if provided
    if (products && products.length > 0) {
      console.log('📝 Creating product records...');
      for (const product of products) {
        if (product.productId) {
          await prisma.appointmentProduct.create({
            data: {
              appointmentId: appointment.id,
              productId: product.productId,
              quantity: product.quantity || 1,
              price: product.price || 0,
            },
          });
        }
      }
      console.log('✅ Product records created');
    }

    // Fetch the complete appointment with all relations
    const completeAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            clientProfile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
              },
            },
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
    });

    if (!completeAppointment) {
      throw new Error('Failed to fetch created appointment');
    }

    // Map services array to additionalServices format
    const additionalServices = completeAppointment.services.map((svc) => ({
      id: svc.id,
      name: svc.service?.name || '',
      price: svc.price ? parseFloat(svc.price.toString()) : 0,
      duration: svc.duration || 0,
      serviceId: svc.serviceId,
    }));

    // Map products array
    const productsArray = completeAppointment.products.map((prod) => ({
      id: prod.id,
      name: prod.product?.name || '',
      price: prod.price ? parseFloat(prod.price.toString()) : 0,
      quantity: prod.quantity || 1,
      productId: prod.productId,
    }));

    // Convert database status to frontend status
    const frontendStatus = dbToFrontendStatus(completeAppointment.status);

    // Also save to localStorage for backward compatibility
    const appointments = getAllAppointments();
    const newAppointment = {
      id: completeAppointment.id,
      clientId: completeAppointment.clientId,
      clientName: completeAppointment.client?.clientProfile?.name || '',
      clientEmail: completeAppointment.client?.email || '',
      clientPhone: completeAppointment.client?.clientProfile?.phone || '',
      staffId: completeAppointment.staffId,
      staffName: completeAppointment.staff?.name || '',
      staffEmail: completeAppointment.staff?.user?.email || '',
      service: completeAppointment.services[0]?.service?.name || '',
      serviceId: completeAppointment.services[0]?.serviceId || '',
      date: completeAppointment.date.toISOString(),
      duration: completeAppointment.duration,
      location: completeAppointment.locationId,
      locationName: completeAppointment.location?.name || '',
      price: completeAppointment.totalPrice ? parseFloat(completeAppointment.totalPrice.toString()) : 0,
      notes: completeAppointment.notes || '',
      status: frontendStatus,
      bookingReference: completeAppointment.bookingReference || '',
      createdAt: completeAppointment.createdAt.toISOString(),
      updatedAt: completeAppointment.updatedAt.toISOString(),
      // Include all services and products
      additionalServices,
      products: productsArray,
      // Initialize status history
      statusHistory: [
        {
          status: frontendStatus,
          timestamp: completeAppointment.createdAt.toISOString(),
          updatedBy: 'System'
        }
      ],
    };
    appointments.push(newAppointment);
    saveAppointments(appointments);

    console.log('✅ Appointment created successfully:', newAppointment.id);
    console.log('✅ Services:', additionalServices.length);
    console.log('✅ Products:', productsArray.length);
    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    console.error("❌ Error type:", typeof error);

    // Log full error details
    if (error instanceof Error) {
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }

    // Log the error object itself
    console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Return detailed error message
    const errorMessage = error instanceof Error ? error.message : "Failed to create appointment";
    return NextResponse.json({
      error: "Failed to create appointment",
      details: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 });
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

    console.log('📝 PUT /api/appointments - Updating appointment:', id);
    console.log('📝 Update data received:', updateData);

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    // Prepare data for Prisma update - only include fields that exist on Appointment model
    const prismaUpdateData: any = {};

    // Map frontend fields to Prisma schema fields
    if (updateData.status) {
      // Use the new bidirectional status mapping
      const newDbStatus = frontendToDbStatus(updateData.status);
      console.log(`📝 Status conversion: Frontend "${updateData.status}" → DB "${newDbStatus}"`);

      // Validate status progression - prevent backward transitions
      // Get current appointment to check current status
      const currentAppointment = await prisma.appointment.findUnique({
        where: { id },
        select: { status: true }
      });

      if (currentAppointment) {
        const currentDbStatus = currentAppointment.status;
        const currentFrontendStatus = dbToFrontendStatus(currentDbStatus);

        // Define status progression order (must match database statuses)
        const dbStatusProgression = ['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
        const terminalDbStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

        // Check if current status is terminal
        if (terminalDbStatuses.includes(currentDbStatus)) {
          console.error(`❌ Cannot update status: appointment is in terminal status "${currentFrontendStatus}"`);
          return NextResponse.json({
            error: `Cannot update appointment status. This appointment is already ${currentFrontendStatus}.`
          }, { status: 400 });
        }

        // Check for backward transition (only for non-terminal statuses)
        if (!terminalDbStatuses.includes(newDbStatus)) {
          const currentIndex = dbStatusProgression.indexOf(currentDbStatus);
          const newIndex = dbStatusProgression.indexOf(newDbStatus);

          if (currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
            console.error(`❌ Backward status transition prevented: "${currentFrontendStatus}" (${currentDbStatus}) → "${updateData.status}" (${newDbStatus})`);
            return NextResponse.json({
              error: `Cannot move appointment status backward from "${currentFrontendStatus}" to "${updateData.status}".`
            }, { status: 400 });
          }
        }

        console.log(`✅ Status transition validated: "${currentFrontendStatus}" (${currentDbStatus}) → "${updateData.status}" (${newDbStatus})`);
      }

      prismaUpdateData.status = newDbStatus;
    }
    if (updateData.date) {
      prismaUpdateData.date = new Date(updateData.date);
    }
    if (updateData.duration !== undefined) {
      prismaUpdateData.duration = updateData.duration;
    }
    if (updateData.totalPrice !== undefined || updateData.price !== undefined) {
      prismaUpdateData.totalPrice = updateData.totalPrice || updateData.price || 0;
    }
    if (updateData.notes !== undefined) {
      prismaUpdateData.notes = updateData.notes;
    }
    if (updateData.clientId) {
      prismaUpdateData.clientId = updateData.clientId;
    }
    if (updateData.staffId) {
      prismaUpdateData.staffId = updateData.staffId;
    }
    if (updateData.locationId || updateData.location) {
      prismaUpdateData.locationId = updateData.locationId || updateData.location;
    }
    if (updateData.statusHistory) {
      // Store statusHistory as JSON string
      prismaUpdateData.statusHistory = JSON.stringify(updateData.statusHistory);
      console.log('📝 Storing statusHistory:', updateData.statusHistory);
    }

    console.log('📝 Prisma update data:', prismaUpdateData);

    // Update in database
    const appointment = await prisma.appointment.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            clientProfile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
              },
            },
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
    });

    console.log('✅ Appointment updated in database:', appointment.id);
    console.log('✅ Database status:', appointment.status);

    // Convert database status back to frontend status using proper mapping
    const frontendStatus = dbToFrontendStatus(appointment.status);
    console.log(`✅ Status conversion for response: DB "${appointment.status}" → Frontend "${frontendStatus}"`);

    // Map services array to additionalServices format
    const additionalServices = appointment.services.map((svc, index) => ({
      id: svc.id,
      name: svc.service?.name || '',
      price: svc.price ? parseFloat(svc.price.toString()) : 0,
      duration: svc.duration || 0,
      serviceId: svc.serviceId,
    }));

    // Map products array
    const products = appointment.products.map((prod) => ({
      id: prod.id,
      name: prod.product?.name || '',
      price: prod.price ? parseFloat(prod.price.toString()) : 0,
      quantity: prod.quantity || 1,
      productId: prod.productId,
    }));

    // Parse statusHistory from database
    let statusHistory;
    try {
      statusHistory = appointment.statusHistory ? JSON.parse(appointment.statusHistory) : [];
    } catch (error) {
      console.error('Error parsing statusHistory:', error);
      statusHistory = [];
    }

    // If statusHistory is empty, initialize it
    if (statusHistory.length === 0) {
      statusHistory = [
        {
          status: frontendStatus,
          timestamp: appointment.createdAt.toISOString(),
          updatedBy: 'System'
        }
      ];
    }

    // Transform the response to match the expected format
    const updatedAppointment = {
      id: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.client?.clientProfile?.name || '',
      clientEmail: appointment.client?.email || '',
      clientPhone: appointment.client?.clientProfile?.phone || '',
      staffId: appointment.staffId,
      staffName: appointment.staff?.name || '',
      staffEmail: appointment.staff?.user?.email || '',
      locationId: appointment.locationId,
      locationName: appointment.location?.name || '',
      service: appointment.services[0]?.service?.name || '',
      serviceId: appointment.services[0]?.serviceId || '',
      date: appointment.date.toISOString(),
      duration: appointment.duration,
      totalPrice: appointment.totalPrice,
      price: appointment.totalPrice ? parseFloat(appointment.totalPrice.toString()) : 0,
      notes: appointment.notes || '',
      status: frontendStatus, // Use properly mapped frontend status
      statusHistory, // Include the parsed status history
      bookingReference: appointment.bookingReference,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      // Include all services and products
      additionalServices,
      products,
    };

    // Also update in localStorage for backward compatibility
    const appointments = getAllAppointments();
    const index = appointments.findIndex(apt => apt.id === id);
    if (index !== -1) {
      appointments[index] = {
        ...appointments[index],
        ...updatedAppointment, // Use the properly transformed appointment data
        updatedAt: new Date().toISOString(),
      };
      saveAppointments(appointments);
    }

    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

/**
 * DELETE /api/appointments
 *
 * DELETION PREVENTION: Appointments cannot be deleted, only cancelled
 * This endpoint is blocked to enforce data retention and audit trail requirements
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    console.log(`🚫 DELETE /api/appointments - Deletion attempt blocked for appointment: ${id}`);

    // Return error - appointments cannot be deleted, only cancelled
    return NextResponse.json({
      error: "Appointments cannot be deleted. Please cancel the appointment instead by updating its status to 'cancelled'.",
      message: "Deletion is not allowed. Use cancellation to preserve appointment history.",
      suggestion: "To cancel this appointment, update its status to 'cancelled' using the PUT endpoint."
    }, { status: 403 }); // 403 Forbidden
  } catch (error) {
    console.error("Error in DELETE endpoint:", error);
    return NextResponse.json({
      error: "Appointments cannot be deleted. Please cancel the appointment instead."
    }, { status: 403 });
  }
}
