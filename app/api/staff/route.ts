import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders, filterStaffByLocationAccess } from '@/lib/auth-server';

// Map staff roles to UserRole enum values
function mapStaffRoleToUserRole(staffRole: string): string {
  const roleMapping: { [key: string]: string } = {
    // Admin roles
    'super_admin': 'ADMIN',
    'org_admin': 'ADMIN',

    // Manager roles
    'location_manager': 'MANAGER',
    'manager': 'MANAGER',

    // Receptionist role
    'receptionist': 'RECEPTIONIST',

    // Sales role
    'sales': 'SALES',

    // Staff roles (all salon workers)
    'stylist': 'STAFF',
    'colorist': 'STAFF',
    'barber': 'STAFF',
    'nail_technician': 'STAFF',
    'esthetician': 'STAFF',
    'staff': 'STAFF',

    // Client role
    'client': 'CLIENT'
  };

  const normalizedRole = staffRole.toLowerCase().trim();
  return roleMapping[normalizedRole] || 'STAFF'; // Default to STAFF if role not found
}

// Map UserRole back to frontend role format (preserve original staff roles)
function mapUserRoleToStaffRole(userRole: string, originalRole?: string): string {
  // If we have the original role stored somewhere, use it
  if (originalRole) {
    return originalRole.toLowerCase();
  }

  // Otherwise, map based on UserRole
  switch (userRole) {
    case 'ADMIN':
      return 'super_admin';
    case 'MANAGER':
      return 'location_manager';
    case 'STAFF':
      return 'stylist'; // Default staff role
    case 'CLIENT':
      return 'client';
    default:
      return 'stylist';
  }
}

/**
 * GET /api/staff
 *
 * Fetch all staff members from database
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');

    // Try to get staff from database first
    interface TransformedStaff {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      locations: string[];
      status: string;
      avatar: string;
      color: string;
      homeService: boolean;
      specialties: any[];
      employeeNumber: string;
      dateOfBirth: string;
      qidNumber: string;
      passportNumber: string;
      qidValidity: string;
      passportValidity: string;
      medicalValidity: string;
      profileImage: string;
      profileImageType: string;
    }

    let allStaff: TransformedStaff[];
    
    // Check database connection
    try {
      await prisma.$connect();
    } catch (error: any) {
      console.error('Database connection error:', error);
      return NextResponse.json({ error: 'Database connection failed', details: error.message }, { status: 503 });
    }

    try {
      interface StaffMemberWithRelations {
        id: string;
        name: string;
        user: { email: string; role: string };
        locations: Array<{ locationId: string }>;
        phone: string | null;
        jobRole: string | null;
        status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
        avatar: string | null;
        color: string | null;
        homeService: boolean;
        specialties: string | null;
        employeeNumber: string | null;
        dateOfBirth: Date | null;
        qidNumber: string | null;
        passportNumber: string | null;
        qidValidity: string | null;
        passportValidity: string | null;
        medicalValidity: string | null;
        profileImage: string | null;
        profileImageType: string | null;
      }

      // Set a reasonable timeout for the query
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      );

      const queryPromise = prisma.staffMember.findMany({
        include: {
          user: true,
          locations: {
            include: {
              location: true
            }
          },
          services: {
            include: {
              service: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const dbStaff = await Promise.race([queryPromise, timeoutPromise]) as StaffMemberWithRelations[];

      console.log(`GET /api/staff - Found ${dbStaff.length} staff members in database`);

      if (dbStaff.length > 0) {
        console.log('Sample staff IDs:', dbStaff.slice(0, 3).map((s: StaffMemberWithRelations) => `${s.name}: ${s.id}`));

        // Transform database data to match frontend interface
        allStaff = dbStaff.map((staff: StaffMemberWithRelations, index: number) => {
          try {
            return {
              id: staff.id,
          name: staff.name,
          email: staff.user.email,
          phone: staff.phone || '',
          role: staff.jobRole || mapUserRoleToStaffRole(staff.user.role), // Use jobRole if available, otherwise map from UserRole
          locations: staff.locations.map((loc: { locationId: string }) => loc.locationId),
          status: staff.status === 'ACTIVE' ? 'Active' : staff.status === 'INACTIVE' ? 'Inactive' : 'On Leave',
          avatar: staff.avatar || staff.name.split(' ').map((n: string) => n[0]).join(''),
          color: staff.color || 'bg-purple-100 text-purple-800',
          homeService: staff.homeService,
          specialties: staff.specialties ? (() => {
            try {
              return JSON.parse(staff.specialties);
            } catch (e) {
              console.warn('Failed to parse specialties JSON:', staff.specialties);
              return [];
            }
          })() : [],
          // HR Document Management Fields from database
          employeeNumber: staff.employeeNumber || '',
          dateOfBirth: staff.dateOfBirth ? (() => {
            // Handle both Date objects and string formats
            if (typeof staff.dateOfBirth === 'string') {
              // If already in DD-MM-YY format, return as is
              if (/^\d{2}-\d{2}-\d{2}$/.test(staff.dateOfBirth)) {
                return staff.dateOfBirth
              }
              // If in other string format, try to parse and convert
              return staff.dateOfBirth
            } else {
              // Handle Date object
              const date = staff.dateOfBirth.toISOString().split('T')[0] // YYYY-MM-DD
              const [year, month, day] = date.split('-')
              const shortYear = year.slice(-2) // Get last 2 digits for YY format
              return `${day}-${month}-${shortYear}` // Convert to DD-MM-YY for frontend
            }
          })() : '',
          qidNumber: staff.qidNumber || '',
          passportNumber: staff.passportNumber || '',
          qidValidity: staff.qidValidity || '',
          passportValidity: staff.passportValidity || '',
          medicalValidity: staff.medicalValidity || '',
          profileImage: staff.profileImage || staff.avatar || '',
          profileImageType: staff.profileImageType || ''
            };
          } catch (err) {
            console.error(`Error transforming staff member ${staff.id}:`, err);
            return {
              id: staff.id,
              name: staff.name,
              email: staff.user.email,
              phone: '',
              role: 'staff',
              locations: [],
              status: 'Inactive',
              avatar: '',
              color: 'bg-purple-100 text-purple-800',
              homeService: false,
              specialties: [],
              employeeNumber: '',
              dateOfBirth: '',
              qidNumber: '',
              passportNumber: '',
              qidValidity: '',
              passportValidity: '',
              medicalValidity: '',
              profileImage: '',
              profileImageType: ''
            };
          }
        });
      } else {
        console.log('No staff found in database');
        allStaff = [];
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError; // Don't fallback - database is single source of truth
    }

    // Get user information for access control
    const currentUser = getUserFromHeaders(request);

    // Filter by location if provided
    let filteredStaff = allStaff;
    if (locationId) {
      if (locationId === 'home') {
        // Only admin users can access home service staff
        if (currentUser?.role !== 'ADMIN') {
          filteredStaff = [];
        } else {
          filteredStaff = allStaff.filter((s: typeof allStaff[0]) => s.homeService === true || s.locations.includes('home'));
        }
      } else {
        filteredStaff = allStaff.filter((s: typeof allStaff[0]) => s.locations.includes(locationId));
      }
    }

    // Apply user-based access control
    if (currentUser && currentUser.role !== 'ADMIN') {
      // Filter out home service staff for non-admin users
      filteredStaff = filteredStaff.filter((s: typeof filteredStaff[0]) => {
        // Remove staff that only have home service or are assigned to home location
        return !(s.homeService === true || s.locations.includes('home'));
      });

      // Apply location-based filtering using existing function
      filteredStaff = filterStaffByLocationAccess(filteredStaff, currentUser.locations || []);
    }

    // Return the staff data
    return NextResponse.json(
      { staff: filteredStaff },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        }
      }
    );
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    
    // Handle specific error types
    if (error.message === 'Database query timeout') {
      return NextResponse.json({ 
        error: 'Database query timed out',
        details: 'The request took too long to process'
      }, { status: 504 });
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Database constraint violation',
        details: error.message 
      }, { status: 409 });
    }
    
    if (error.code?.startsWith('P')) {
      return NextResponse.json({ 
        error: 'Database error occurred',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Failed to fetch staff data',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/staff
 *
 * Create a new staff member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, locations, status, homeService, employeeNumber, dateOfBirth, qidNumber, passportNumber, qidValidity, passportValidity, medicalValidity, profileImage, profileImageType } = body;

    // Try to create in database first
    try {
      // Create user first with enhanced password security
      const { mapStaffRoleToUserRole } = await import('@/lib/auth-utils');
      const bcrypt = await import('bcryptjs');
      const userRole = mapStaffRoleToUserRole(role);
      const hashedPassword = await bcrypt.hash('temp123', 12); // Temporary password - should be changed on first login

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: userRole,
          isActive: status === 'Active'
        }
      });

      // Create staff member
      const staff = await prisma.staffMember.create({
        data: {
          userId: user.id,
          name,
          phone,
          avatar: name.split(' ').map((n: string) => n[0]).join(''),
          color: 'bg-purple-100 text-purple-800',
          jobRole: role, // Store the specific job role
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          homeService: homeService || false,
          status: status === 'Active' ? 'ACTIVE' : status === 'Inactive' ? 'INACTIVE' : 'ON_LEAVE',
          // HR Document Management Fields
          employeeNumber,
          qidNumber,
          passportNumber,
          qidValidity,
          passportValidity,
          medicalValidity,
          profileImage,
          profileImageType
        },
        include: {
          user: true,
          locations: {
            include: {
              location: true
            }
          }
        }
      });

      // Add location associations - if none provided, assign to all active locations
      let locationIds = locations
      if (!locationIds || locationIds.length === 0) {
        console.log("📍 No locations specified for staff, assigning to all active locations...")
        const allLocations = await prisma.location.findMany({
          where: { isActive: true },
          select: { id: true }
        })
        locationIds = allLocations.map(loc => loc.id)
        console.log(`📍 Found ${locationIds.length} active locations to assign`)
      }

      if (locationIds && locationIds.length > 0) {
        await Promise.all(
          locationIds.map((locationId: string) =>
            prisma.staffLocation.create({
              data: {
                staffId: staff.id,
                locationId
              }
            })
          )
        );
      }

      // Transform response to match frontend interface
      const transformedStaff = {
        id: staff.id,
        name: staff.name,
        email: staff.user.email,
        phone: staff.phone || '',
        role: staff.jobRole || role, // Use the stored jobRole
        locations: locationIds || [],
        status: staff.status === 'ACTIVE' ? 'Active' : staff.status === 'INACTIVE' ? 'Inactive' : 'On Leave',
        avatar: staff.avatar || staff.name.split(' ').map(n => n[0]).join(''),
        color: staff.color || 'bg-purple-100 text-purple-800',
        homeService: staff.homeService,
        specialties: staff.specialties ? (() => {
          try {
            return JSON.parse(staff.specialties);
          } catch (e) {
            console.warn('Failed to parse specialties JSON:', staff.specialties);
            return [];
          }
        })() : [],
        employeeNumber: employeeNumber || '',
        dateOfBirth: staff.dateOfBirth ? (() => {
          // Handle both Date objects and string formats
          if (typeof staff.dateOfBirth === 'string') {
            // If already in DD-MM-YY format, return as is
            if (/^\d{2}-\d{2}-\d{2}$/.test(staff.dateOfBirth)) {
              return staff.dateOfBirth
            }
            // If in other string format, try to parse and convert
            return staff.dateOfBirth
          } else {
            // Handle Date object
            const date = staff.dateOfBirth.toISOString().split('T')[0] // YYYY-MM-DD
            const [year, month, day] = date.split('-')
            const shortYear = year.slice(-2) // Get last 2 digits for YY format
            return `${day}-${month}-${shortYear}` // Convert to DD-MM-YY for frontend
          }
        })() : '',
        qidValidity: qidValidity || '',
        passportValidity: passportValidity || '',
        medicalValidity: medicalValidity || '',
        profileImage: profileImage || '',
        profileImageType: profileImageType || ''
      };

      return NextResponse.json({ staff: transformedStaff }, { status: 201 });
    } catch (dbError) {
      console.error('Database error creating staff:', dbError);
      throw dbError; // Don't fallback - database is single source of truth
    }
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
