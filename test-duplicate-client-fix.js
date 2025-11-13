/**
 * Test script to verify the duplicate client fix
 * This tests that when a duplicate client is found, the correct User ID is returned
 * for appointment creation (not the Client ID)
 */

async function testDuplicateClientFix() {
  console.log("=== TESTING DUPLICATE CLIENT FIX ===\n");

  try {
    // Step 1: Create a test client
    console.log("Step 1: Creating a test client...");
    const createResponse = await fetch("/api/clients/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Duplicate Client",
        phone: "+974-5555-0001",
        email: "test-duplicate@example.com",
        registrationSource: "test",
        isAutoRegistered: false,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create client: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    const createdClient = createData.client;
    console.log("✅ Client created successfully");
    console.log(`   Client ID (User ID): ${createdClient.id}`);
    console.log(`   Client Name: ${createdClient.name}`);
    console.log(`   Client Phone: ${createdClient.phone}\n`);

    // Step 2: Check for duplicate using the check-duplicate endpoint
    console.log("Step 2: Checking for duplicate client...");
    const checkResponse = await fetch("/api/clients/check-duplicate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Duplicate Client",
        phone: "+974-5555-0001",
      }),
    });

    if (!checkResponse.ok) {
      throw new Error(`Failed to check duplicate: ${checkResponse.statusText}`);
    }

    const checkData = await checkResponse.json();
    console.log("✅ Duplicate check completed");
    console.log(`   Has Duplicates: ${checkData.hasDuplicates}`);

    if (checkData.hasDuplicates && checkData.duplicates.length > 0) {
      const duplicate = checkData.duplicates[0];
      console.log(`   Duplicate Type: ${duplicate.type}`);
      console.log(`   Duplicate Client ID: ${duplicate.client.id}`);
      console.log(`   Duplicate Client Name: ${duplicate.client.name}\n`);

      // Step 3: Verify the ID matches
      console.log("Step 3: Verifying the returned ID...");
      if (duplicate.client.id === createdClient.id) {
        console.log("✅ SUCCESS: Duplicate client ID matches the created client ID");
        console.log(`   Both are: ${duplicate.client.id}`);
        console.log("\n🎉 The fix is working correctly!");
        console.log("   The check-duplicate endpoint now returns the User ID (not Client ID)");
        console.log("   This ID can be used directly for appointment creation\n");
      } else {
        console.log("❌ FAILURE: Duplicate client ID does NOT match");
        console.log(`   Created Client ID: ${createdClient.id}`);
        console.log(`   Duplicate Client ID: ${duplicate.client.id}`);
        console.log("\n⚠️ The fix may not be working correctly\n");
      }

      // Step 4: Verify the duplicate client object has all required fields
      console.log("Step 4: Verifying duplicate client object has all required fields...");
      const requiredFields = [
        "id",
        "name",
        "phone",
        "email",
        "address",
        "city",
        "state",
        "birthday",
        "preferredLocation",
        "locations",
        "status",
        "avatar",
        "segment",
        "totalSpent",
        "referredBy",
        "preferences",
        "notes",
        "registrationSource",
        "isAutoRegistered",
        "createdAt",
        "updatedAt",
      ];

      const missingFields = requiredFields.filter(
        (field) => !(field in duplicate.client)
      );

      if (missingFields.length === 0) {
        console.log("✅ All required fields are present in the duplicate client object");
      } else {
        console.log(`⚠️ Missing fields: ${missingFields.join(", ")}`);
      }
    } else {
      console.log("⚠️ No duplicates found (this is unexpected for this test)\n");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testDuplicateClientFix();

