// Test script to check PUT endpoint using Node.js built-in modules
const https = require('https');
const http = require('http');

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonResponse });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testUpdateEndpoint() {
  try {
    // First, get the list of employees to find an ID
    console.log('1. Getting existing employees...');
    const getResponse = await makeRequest('http://localhost:5000/api/employeelist', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('GET response status:', getResponse.status);
    console.log('Employees found:', getResponse.data.data?.length || 0);
    
    if (getResponse.data.data && getResponse.data.data.length > 0) {
      const firstEmployee = getResponse.data.data[0];
      console.log('First employee:', firstEmployee);
      
      // Test updating this employee
      console.log('\n2. Testing update...');
      const updateData = {
        name: firstEmployee.name + ' (Updated)',
        position: firstEmployee.position,
        location: firstEmployee.location,
        salary: firstEmployee.salary + 1000
      };
      
      console.log('Update data:', updateData);
      
      const updateResponse = await makeRequest(
        `http://localhost:5000/api/employeelist/${firstEmployee._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        },
        updateData
      );
      
      console.log('Update response status:', updateResponse.status);
      console.log('Update response:', updateResponse.data);
    } else {
      console.log('No employees found to test with');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUpdateEndpoint();