import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true,
    enum: ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Management']
  },
  position: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  phone: {
    type: String
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['employee', 'admin', 'hr'],
    default: 'employee'
  }
}, {
  timestamps: true
})

const User = mongoose.model("User", UserSchema);

export default User