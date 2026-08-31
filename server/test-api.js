const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const error = new Error(`Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function runTests() {
  console.log('--- Starting API Verification Tests ---');

  try {
    // 1. Test Admin Login
    console.log('1. Testing Admin Login (admin@crm.com)...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@crm.com',
        password: 'Admin@123',
        role: 'admin',
      },
    });
    console.log('✓ Admin login successful! Token received.');
    const adminToken = adminLoginRes.token;

    // 2. Test Employee Login
    console.log('2. Testing Employee Login (priya@crm.com)...');
    const empLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'priya@crm.com',
        password: 'Sales@123',
        role: 'employee',
      },
    });
    console.log('✓ Employee login successful! User:', empLoginRes.user.name);
    const empToken = empLoginRes.token;

    // 3. Test Role Scoping: Employee should only get own customers
    console.log('3. Testing Employee Customer Data Scoping...');
    const empCustomersRes = await request('/customers', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    console.log(`✓ Priya sees only her ${empCustomersRes.total} customer records.`);
    const nonPriyaCustomer = empCustomersRes.customers.find(
      (c) => c.salesEmployeeName !== 'Priya Sharma'
    );
    if (nonPriyaCustomer) {
      throw new Error('SECURITY VIOLATION: Employee saw customer belonging to someone else!');
    }
    console.log('✓ Verified: Zero leakage of other employees\' customer data.');

    // 4. Test Customer Creation by Employee (Auto-assigned name test)
    console.log('4. Testing Customer Creation with Employee Profile Auto-assignment...');
    const newCustRes = await request('/customers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: {
        customerName: 'Test Automation Customer ' + Date.now(),
        mobileNumber: '99' + Math.floor(10000000 + Math.random() * 90000000),
        location: 'Cyber Hub',
        city: 'Gurgaon',
        state: 'Haryana',
        productInterested: 'Cloud CRM',
        leadSource: 'Website',
        followUpDate: new Date(),
        followUpStatus: 'New',
        salesEmployeeName: 'HACKED NAME ATTEMPT', // Attempt to override
      },
    });
    if (newCustRes.customer.salesEmployeeName !== 'Priya Sharma') {
      throw new Error('SECURITY VIOLATION: Employee was able to override sales employee name!');
    }
    console.log(`✓ Verified: Customer automatically assigned to "${newCustRes.customer.salesEmployeeName}" (Ignored malicious override).`);

    // 5. Test Employee cannot edit salesEmployeeName
    console.log('5. Testing Employee cannot edit sales employee name...');
    const updateRes = await request(`/customers/${newCustRes.customer._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${empToken}` },
      body: {
        customerName: 'Updated Test Name',
        salesEmployeeName: 'Admin Director', // Employee trying to reassign
      },
    });
    if (updateRes.customer.salesEmployeeName !== 'Priya Sharma') {
      throw new Error('SECURITY VIOLATION: Employee successfully modified assigned sales employee name on update!');
    }
    console.log('✓ Verified: Sales employee name remained immutable when edited by employee.');

    // 6. Test Duplicate Mobile Prevention
    console.log('6. Testing Duplicate Mobile Prevention...');
    try {
      await request('/customers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}` },
        body: {
          customerName: 'Duplicate Attempt',
          mobileNumber: newCustRes.customer.mobileNumber, // same mobile
          location: 'Test Area',
          city: 'Delhi',
          state: 'Delhi',
          productInterested: 'Test',
          leadSource: 'Website',
          followUpDate: new Date(),
        },
      });
      throw new Error('FAILED: Duplicate mobile was permitted!');
    } catch (err) {
      if (err.status === 400) {
        console.log('✓ Verified: Duplicate mobile number blocked with 400 Bad Request.');
      } else {
        throw err;
      }
    }

    // 7. Test Admin Analytics
    console.log('7. Testing Admin Analytics Dashboard endpoint...');
    const analyticsRes = await request('/analytics/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`✓ Admin Stats received: ${analyticsRes.stats.totalCustomers} total customers, ${analyticsRes.stats.totalEmployees} employees.`);

    // 8. Test Employee Signup & Admin Approval Flow
    console.log('8. Testing Employee Signup & Admin Approval Flow...');
    const testSignupEmail = `test.employee.${Date.now()}@crm.com`;
    const signupRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Onboard Employee',
        email: testSignupEmail,
        phone: '9898989898',
        designation: 'Junior Trainee',
        password: 'Sales@123',
      },
    });
    console.log('✓ Signup submitted with status: pending.');

    // Attempt login before approval (should be rejected)
    try {
      await request('/auth/login', {
        method: 'POST',
        body: {
          email: testSignupEmail,
          password: 'Sales@123',
        },
      });
      throw new Error('FAILED: Pending user was able to log in without approval!');
    } catch (err) {
      if (err.status === 403) {
        console.log('✓ Verified: Pending employee cannot log in before approval (403 Forbidden).');
      } else {
        throw err;
      }
    }

    // Admin approves the employee
    const newUserId = signupRes.user.id;
    await request(`/employees/${newUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'approved' },
    });
    console.log('✓ Admin approved the employee account.');

    // Now employee should be able to log in
    const approvedLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testSignupEmail,
        password: 'Sales@123',
      },
    });
    console.log(`✓ Verified: Approved employee successfully logged in (Token: ${approvedLoginRes.token.slice(0, 15)}...).`);

    console.log('\n========================================');
    console.log('🎉 ALL 8 BACKEND AND SECURITY TESTS PASSED!');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error.data || error.message);
    process.exit(1);
  }
}

runTests();
