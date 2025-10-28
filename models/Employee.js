const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Employee position is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Employee location is required'],
    trim: true
  },
  salary: {
    type: Number,
    required: [true, 'Employee salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required'],
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Employee', employeeSchema);