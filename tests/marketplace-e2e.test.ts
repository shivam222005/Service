import express from 'express';
import { apiRouter } from '../server/api.js';
import { db, initDatabase } from '../server/db.js';

interface TestContext {
  baseUrl: string;
  server: any;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(baseUrl: string, path: string, options: RequestInit = {}) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: response.headers
  };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   SERVICEHUB PRODUCTION READINESS E2E TEST SUITE     ');
  console.log('======================================================\n');

  // 1. Initialize SQLite Database
  initDatabase();
  console.log('[Setup] Database initialized and verified.\n');

  // 2. Start Test Express Server
  const app = express();
  app.use(express.json());
  
  // Health check endpoint mirror
  app.get('/api/health', (req, res) => {
    try {
      const check = db.prepare('SELECT 1 as healthy').get() as { healthy: number };
      res.json({
        status: 'healthy',
        database: check && check.healthy === 1 ? 'ok' : 'degraded',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  });

  app.use('/api', apiRouter);

  const server = await new Promise<any>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Setup] In-process test server running at ${baseUrl}\n`);

  try {
    // --------------------------------------------------------
    // TEST SUITE 1: SYSTEM HEALTH & ARCHITECTURE
    // --------------------------------------------------------
    console.log('--- TEST SUITE 1: System Health & Database Health ---');
    const health = await request(baseUrl, '/api/health');
    assert(health.status === 200, 'Health endpoint responds with HTTP 200');
    assert(health.data.status === 'healthy', 'System status is healthy');
    assert(health.data.database === 'ok', 'SQLite database responds with ok');

    // --------------------------------------------------------
    // TEST SUITE 2: DATABASE PERSISTENCE & SCHEMA INTEGRITY
    // --------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Database Schema & Integrity ---');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t: any) => t.name);
    const requiredTables = ['users', 'provider_profiles', 'categories', 'services', 'bookings', 'payments', 'reviews', 'emergency_requests', 'notifications'];
    for (const table of requiredTables) {
      assert(tables.includes(table), `Table "${table}" exists in SQLite schema`);
    }

    // --------------------------------------------------------
    // TEST SUITE 3: AUTHENTICATION, REGISTRATION & SECURITY
    // --------------------------------------------------------
    console.log('\n--- TEST SUITE 3: Authentication & Security ---');
    const testTimestamp = Date.now();
    const customerEmail = `e2e_cust_${testTimestamp}@example.com`;
    const providerEmail = `e2e_pro_${testTimestamp}@example.com`;
    const testPassword = 'Password@123';

    // 3.1 Reject invalid role ADMIN on public registration
    const fakeAdminReg = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Hacker',
        email: `hacker_${testTimestamp}@example.com`,
        password: testPassword,
        role: 'ADMIN'
      })
    });
    assert(fakeAdminReg.status === 403, 'Public registration rejects ADMIN role with HTTP 403');

    // 3.2 Reject short passwords
    const shortPassReg = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Shorty',
        email: `short_${testTimestamp}@example.com`,
        password: '123',
        role: 'CUSTOMER'
      })
    });
    assert(shortPassReg.status === 400, 'Rejects password shorter than 6 characters with HTTP 400');

    // 3.3 Valid Customer Registration
    const custReg = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Anita Deshmukh',
        email: customerEmail,
        password: testPassword,
        role: 'CUSTOMER',
        phone: '+91 98220 12345'
      })
    });
    assert(custReg.status === 201, 'Customer registered successfully with HTTP 201');
    assert(typeof custReg.data.token === 'string', 'Registration returns JWT token');
    assert(custReg.data.user.email === customerEmail, 'Registered user email matches');
    assert(custReg.data.user.role === 'CUSTOMER', 'Registered user role is CUSTOMER');

    // 3.4 Reject duplicate email registration
    const dupReg = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Anita Duplicate',
        email: customerEmail,
        password: testPassword,
        role: 'CUSTOMER'
      })
    });
    assert(dupReg.status === 409, 'Duplicate email registration rejected with HTTP 409 Conflict');

    // 3.5 Login with invalid password
    const wrongLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: customerEmail,
        password: 'WrongPassword999'
      })
    });
    assert(wrongLogin.status === 401, 'Login with incorrect password rejected with HTTP 401');

    // 3.6 Login with valid credentials
    const validLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: customerEmail,
        password: testPassword
      })
    });
    assert(validLogin.status === 200, 'Login with valid credentials succeeds with HTTP 200');
    const customerToken = validLogin.data.token;
    assert(typeof customerToken === 'string', 'Valid login returns JWT token');

    // 3.7 Session Hydration /api/auth/me
    const custMe = await request(baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(custMe.status === 200, 'Authenticated /api/auth/me succeeds with HTTP 200');
    assert(custMe.data.user.id === validLogin.data.user.id, 'Hydrated user ID matches session');

    // 3.8 Reject /api/auth/me without valid token
    const unauthMe = await request(baseUrl, '/api/auth/me', {
      headers: { Authorization: 'Bearer invalid-token-123' }
    });
    assert(unauthMe.status === 403, 'Invalid token returns HTTP 403 on protected route');

    // 3.9 Register Service Provider
    const proReg = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ganesh Shinde',
        email: providerEmail,
        password: testPassword,
        role: 'SERVICE_PROVIDER',
        phone: '+91 94220 54321',
        businessName: 'Ganesh Solar & Agri Equipment Care',
        bio: 'Certified technician with 8 years repairing drip irrigation & solar pumps in Baramati taluka.',
        experienceYears: 8,
        hourlyRate: 500,
        serviceArea: 'Baramati, Daund, Indapur talukas',
        city: 'Baramati',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '413102',
        serviceModes: ['ON_SITE'],
        skills: ['Solar Pump Inverters', 'Drip Submersible Systems', 'Motor Rewinding']
      })
    });
    assert(proReg.status === 201, 'Service Provider registered successfully with HTTP 201');
    const providerToken = proReg.data.token;
    const providerId = proReg.data.user.id;

    // --------------------------------------------------------
    // TEST SUITE 4: ADMIN GOVERNANCE & PROVIDER VERIFICATION
    // --------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Admin Governance & Verification ---');
    // Login as seeded default Admin
    const adminLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@servicehub.in',
        password: 'Admin@123'
      })
    });
    console.log('adminLogin status and data:', adminLogin.status, adminLogin.data);
    assert(adminLogin.status === 200, 'Admin logs in with default seed credentials');
    const adminToken = adminLogin.data.token;

    // Admin verifies provider
    const verifyRes = await request(baseUrl, `/api/admin/providers/${providerId}/verify`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    assert(verifyRes.status === 200, 'Admin approves provider account');

    // Verify provider profile now shows APPROVED
    const proMe = await request(baseUrl, '/api/auth/me', {
      headers: { Authorization: `Bearer ${providerToken}` }
    });
    assert(proMe.data.providerProfile.verification_status === 'APPROVED', 'Provider profile status is now APPROVED');

    // Admin fetches registered users
    const adminUsers = await request(baseUrl, '/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsers.status === 200, 'Admin fetches all user accounts with HTTP 200');
    assert(Array.isArray(adminUsers.data) && adminUsers.data.length >= 3, 'User accounts list returned');

    // Non-admin attempting to access /api/admin/users is rejected
    const forbiddenUsers = await request(baseUrl, '/api/admin/users', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(forbiddenUsers.status === 403, 'Customer rejected with HTTP 403 when accessing admin user controls');

    // Admin fetches all services across marketplace
    const adminServices = await request(baseUrl, '/api/admin/services', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminServices.status === 200, 'Admin fetches all marketplace services with HTTP 200');
    assert(Array.isArray(adminServices.data), 'Admin services catalog returned as array');

    // --------------------------------------------------------
    // TEST SUITE 5: SERVICE CATALOG & CREATION
    // --------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Service Catalog & Creation ---');
    // Fetch categories
    const catRes = await request(baseUrl, '/api/categories');
    assert(catRes.status === 200, 'Categories fetched successfully');
    assert(Array.isArray(catRes.data) && catRes.data.length > 0, 'Categories returned as non-empty list');
    const targetCategoryId = catRes.data[0].id;

    // Approved Provider creates service
    const createService = await request(baseUrl, '/api/services', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        category_id: targetCategoryId,
        title: 'Complete Solar Pump Inspection & Repair',
        description: 'Comprehensive diagnostic of motor rewinding, panel wiring, and control box inverter repair for rural farms.',
        price: 850,
        pricing_unit: 'fixed',
        duration_minutes: 90,
        service_mode: 'ON_SITE',
        service_area: 'Baramati Taluka & Surrounding Villages',
        pincodes_covered: '413102, 413133'
      })
    });
    assert(createService.status === 201, 'Approved provider creates service listing');
    const serviceId = createService.data.id;

    // Verify service listing is searchable
    const searchServices = await request(baseUrl, `/api/services?providerId=${providerId}`);
    assert(searchServices.status === 200, 'Service listing query succeeds');
    assert(searchServices.data.some((s: any) => s.id === serviceId), 'Newly created service appears in provider listings');

    // --------------------------------------------------------
    // TEST SUITE 6: BOOKING LIFECYCLE, DOUBLE-BOOKING & RBAC
    // --------------------------------------------------------
    console.log('\n--- TEST SUITE 6: End-to-End Booking Lifecycle & RBAC ---');
    const bookingDate = '2026-11-15';
    const bookingSlot = '10:00 AM - 11:30 AM';

    // 6.1 Customer creates a booking
    const bookRes = await request(baseUrl, '/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        service_id: serviceId,
        booking_date: bookingDate,
        time_slot: bookingSlot,
        address: 'Farm Plot 44, Near Sharda Milk Chilling Plant, Baramati Rural',
        pincode: '413102',
        district: 'Pune',
        notes: 'Inverter error 04 appearing during peak sunlight hours.',
        payment_method: 'Cash on Service / COD'
      })
    });
    assert(bookRes.status === 201, 'Customer creates booking with status 201');
    const bookingId = bookRes.data.id;

    // 6.2 Double-booking prevention
    const doubleBookRes = await request(baseUrl, '/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        service_id: serviceId,
        booking_date: bookingDate,
        time_slot: bookingSlot,
        address: 'Another Farm, Baramati',
        pincode: '413102'
      })
    });
    assert(doubleBookRes.status === 409, 'Double-booking at identical slot rejected with HTTP 409 Conflict');

    // 6.3 Customer RBAC: Customer cannot change provider status directly
    const unauthorizedStatus = await request(baseUrl, `/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    console.log('unauthorizedStatus:', unauthorizedStatus.status, unauthorizedStatus.data);
    assert(unauthorizedStatus.status === 403, 'Customer cannot update booking to IN_PROGRESS (HTTP 403)');

    // 6.4 Provider workflow: Accept booking
    const acceptRes = await request(baseUrl, `/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: 'ACCEPTED' })
    });
    assert(acceptRes.status === 200, 'Provider accepts booking');

    // 6.5 Provider workflow: Mark IN_PROGRESS
    const progressRes = await request(baseUrl, `/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    assert(progressRes.status === 200, 'Provider starts work (IN_PROGRESS)');

    // 6.6 Post-Service Payment Workflow (Rapido-Inspired QR Settlement)
    console.log('\n--- TEST SUITE 6.B: Post-Service QR Payment & Invoicing ---');
    
    // 6.6.1 Customer cannot trigger completion & bill generation
    const customerCompleteAttempt = await request(baseUrl, `/api/bookings/${bookingId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(customerCompleteAttempt.status === 403, 'Customer cannot trigger provider service completion (HTTP 403)');

    // 6.6.2 Assigned provider completes service -> Transitions to AWAITING_PAYMENT & generates UPI QR
    const completeRes = await request(baseUrl, `/api/bookings/${bookingId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` }
    });
    assert(completeRes.status === 200, 'Assigned provider completes service with HTTP 200');
    assert(completeRes.data.booking.status === 'AWAITING_PAYMENT', 'Booking status transitions to AWAITING_PAYMENT');
    assert(completeRes.data.payment.status === 'PENDING', 'Payment record initialized with status PENDING');
    assert(completeRes.data.payment.qr_string.startsWith('upi://pay?'), 'Valid UPI Intent URI generated (upi://pay?pa=...)');
    assert(completeRes.data.payment.qr_data_url.startsWith('data:image/png;base64,'), 'High-resolution base64 QR Data URL generated');
    assert(completeRes.data.breakdown.platformFee === 29, 'Platform fee transparently calculated at ₹29');
    assert(completeRes.data.breakdown.taxRatePercent === 18, 'GST rate transparently calculated at 18%');
    assert(completeRes.data.breakdown.totalAmount > completeRes.data.breakdown.baseAmount, 'Total customer payable includes base + tax + platform fee');

    const paymentId = completeRes.data.payment.id;

    // 6.6.3 Customer fetches payment details
    const getPaymentRes = await request(baseUrl, `/api/bookings/${bookingId}/payment`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(getPaymentRes.status === 200, 'Customer fetches payment session details with HTTP 200');
    assert(getPaymentRes.data.payment.id === paymentId, 'Payment ID matches active session');
    assert(getPaymentRes.data.breakdown.totalAmount === completeRes.data.breakdown.totalAmount, 'Breakdown totals match');

    // 6.6.4 Customer verifies UPI payment event
    const paymentVerifyRes = await request(baseUrl, `/api/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        bank_reference: 'UPI-TEST-SETTLED-998877'
      })
    });
    assert(paymentVerifyRes.status === 200, 'Payment verified successfully with HTTP 200');
    assert(paymentVerifyRes.data.payment.status === 'PAID', 'Payment status updated to PAID');
    assert(paymentVerifyRes.data.booking.status === 'COMPLETED', 'Booking status updated to COMPLETED');
    assert(paymentVerifyRes.data.booking.payment_status === 'PAID', 'Booking payment_status updated to PAID');
    assert(paymentVerifyRes.data.receipt.receipt_id.startsWith('SHUB-RCP-'), 'Verifiable tax receipt generated with official SHUB-RCP prefix');

    // 6.6.5 Idempotency: Second verify call succeeds without double-settlement
    const secondVerifyRes = await request(baseUrl, `/api/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        bank_reference: 'UPI-TEST-SETTLED-998877'
      })
    });
    assert(secondVerifyRes.status === 200, 'Idempotent verification returns HTTP 200 without double-charging');
    assert(secondVerifyRes.data.payment.status === 'PAID', 'Payment remains PAID');

    // 6.6.6 Download / Fetch Tax Invoice Receipt
    const receiptRes = await request(baseUrl, `/api/bookings/${bookingId}/receipt`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(receiptRes.status === 200, 'Fetch tax invoice receipt responds with HTTP 200');
    assert(receiptRes.data.receipt.payment_status === 'PAID', 'Receipt indicates PAID status');
    assert(receiptRes.data.receipt.bank_reference === 'UPI-TEST-SETTLED-998877', 'Receipt retains verified bank reference');

    // 6.7 Customer leaves a verified review
    const reviewRes = await request(baseUrl, '/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        booking_id: bookingId,
        service_id: serviceId,
        provider_id: providerId,
        rating: 5,
        comment: 'Outstanding repair. Ganesh arrived on his motorbike with replacement capacitors and fixed our solar pump in under an hour.'
      })
    });
    assert(reviewRes.status === 201, 'Customer submits verified review');

    // --------------------------------------------------------
    // TEST SUITE 7: EMERGENCY SOS ASSISTANCE WORKFLOW
    // --------------------------------------------------------
    console.log('\n--- TEST SUITE 7: Emergency SOS Assistance Workflow ---');
    // Customer submits emergency request
    const sosRes = await request(baseUrl, '/api/emergency', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        customer_name: 'Anita Deshmukh',
        customer_phone: '+91 98220 12345',
        emergency_type: 'Short Circuit & Sparking in Submersible Fuse Box',
        description: 'Urgent assistance required; sparks emitting from main agri connection switch.',
        location_address: 'Wadgaon Nimbalkar, Baramati Taluka',
        pincode: '413102',
        district: 'Pune'
      })
    });
    assert(sosRes.status === 201, 'Emergency SOS request logged with HTTP 201');
    const emergencyId = sosRes.data.id;

    // Provider accepts emergency request
    const acceptSos = await request(baseUrl, `/api/emergency/${emergencyId}/accept`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ eta_minutes: 25 })
    });
    assert(acceptSos.status === 200, 'Specialist claims emergency SOS dispatch');

    // Provider marks resolved
    const resolveSos = await request(baseUrl, `/api/emergency/${emergencyId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: 'RESOLVED' })
    });
    assert(resolveSos.status === 200, 'Specialist marks emergency SOS resolved');

    console.log('\n======================================================');
    console.log(`   ALL TESTS PASSED! (${passed} checks passed, 0 failures) `);
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\nE2E Test Execution Failed:', err);
  process.exit(1);
});
