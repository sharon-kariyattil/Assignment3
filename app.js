// Task 1: Initiate app and run server
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import Employee model
const Employee = require('./models/Employee');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Serve static files from dist/Frontend folder
app.use(express.static(path.join(__dirname, '/dist/Frontend')));

// Task 2: Create MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Task 2: Write APIs with error handling

// GET /api/employees - Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// GET /api/employees/:id - Get single employee
app.get('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// POST /api/employees - Add new employee
app.post('/api/employees', async (req, res) => {
  try {
    const { name, position, location, salary, dateOfJoining } = req.body;

    // Validate required fields
    if (!name || !position || !location || salary === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, position, location, salary'
      });
    }

    // Validate salary is a number
    if (isNaN(salary) || salary < 0) {
      return res.status(400).json({
        success: false,
        message: 'Salary must be a valid positive number'
      });
    }

    const employeeData = {
      name,
      position,
      location,
      salary: Number(salary)
    };

    // Add dateOfJoining if provided
    if (dateOfJoining) {
      employeeData.dateOfJoining = new Date(dateOfJoining);
    }

    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: savedEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// PUT /api/employees/:id - Update employee
app.put('/api/employees/:id', async (req, res) => {
  console.log('🔄 PUT /api/employees/:id called');
  console.log('Employee ID:', req.params.id);
  console.log('Update data received:', req.body);
  
  try {
    const { name, position, location, salary, dateOfJoining } = req.body;

    // Validate salary if provided
    if (salary !== undefined && (isNaN(salary) || salary < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Salary must be a valid positive number'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = position;
    if (location !== undefined) updateData.location = location;
    if (salary !== undefined) updateData.salary = Number(salary);
    if (dateOfJoining !== undefined) updateData.dateOfJoining = new Date(dateOfJoining);

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// DELETE /api/employees/:id - Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Additional routes for frontend compatibility (employeelist endpoints)
// GET /api/employeelist - Get all employees (alias for /api/employees)
app.get('/api/employeelist', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json(employees); // Return array directly for frontend compatibility
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// GET /api/employeelist/:id - Get single employee (alias)
app.get('/api/employeelist/:id', async (req, res) => {
  console.log('👤 GET /api/employeelist/:id called for ID:', req.params.id);
  
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// POST /api/employeelist - Add new employee (alias)
app.post('/api/employeelist', async (req, res) => {
  try {
    console.log('Received employee data:', req.body); // Debug log
    
    const { name, position, location, salary } = req.body;

    // Validate required fields
    if (!name || !position || !location || salary === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, position, location, salary'
      });
    }

    // Validate salary is a number
    if (isNaN(salary) || salary < 0) {
      return res.status(400).json({
        success: false,
        message: 'Salary must be a valid positive number'
      });
    }

    const employeeData = {
      name: name.trim(),
      position: position.trim(),
      location: location.trim(),
      salary: Number(salary)
    };

    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();

    console.log('Employee saved successfully:', savedEmployee); // Debug log

    res.status(201).json(savedEmployee); // Return employee directly for frontend
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// PUT /api/employeelist - Update employee (compatibility for frontend that sends _id in body)
app.put('/api/employeelist', async (req, res) => {
  console.log('🔄 PUT /api/employeelist (no id in URL) called');
  console.log('Body received for compatibility update:', req.body);

  try {
    const id = req.body._id || req.body.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing employee id in request body' });
    }

    const { name, position, location, salary, dateOfJoining } = req.body;

    if (salary !== undefined && (isNaN(salary) || salary < 0)) {
      return res.status(400).json({ success: false, message: 'Salary must be a valid positive number' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (position !== undefined) updateData.position = String(position).trim();
    if (location !== undefined) updateData.location = String(location).trim();
    if (salary !== undefined) updateData.salary = Number(salary);
    if (dateOfJoining !== undefined) updateData.dateOfJoining = new Date(dateOfJoining);

    const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    console.log('Compatibility update successful for id:', id);
    return res.status(200).json(employee);
  } catch (error) {
    console.error('Error in compatibility PUT /api/employeelist:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid employee ID format' });
    }
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// PUT /api/employeelist/:id - Update employee (alias)
app.put('/api/employeelist/:id', async (req, res) => {
  console.log('🔄 PUT /api/employeelist/:id called');
  console.log('Employee ID:', req.params.id);
  console.log('Update data received:', req.body);
  
  try {
    const { name, position, location, salary } = req.body;

    if (salary !== undefined && (isNaN(salary) || salary < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Salary must be a valid positive number'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (position !== undefined) updateData.position = position.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (salary !== undefined) updateData.salary = Number(salary);

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// DELETE /api/employeelist/:id - Delete employee (alias)
app.delete('/api/employeelist/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error deleting employee:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Debug route for testing update functionality
app.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug-update.html'));
});

// Serve frontend - this should be last
app.get('/*', function (req, res) {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
  res.sendFile(path.join(__dirname + '/dist/Frontend/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`Frontend served at http://localhost:${PORT}`);
});



