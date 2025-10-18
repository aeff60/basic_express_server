import mongoose from 'mongoose'

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  breakStart: {
    type: Date,
    default: null
  },
  breakEnd: {
    type: Date,
    default: null
  },
  workHours: {
    type: Number,
    default: 0
  },
  breakHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'holiday', 'sick-leave'],
    default: 'absent'
  },
  notes: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Index for efficient queries
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })
AttendanceSchema.index({ date: 1 })
AttendanceSchema.index({ employeeId: 1 })

// Methods
AttendanceSchema.methods.calculateWorkHours = function() {
  if (this.checkIn && this.checkOut) {
    const workTime = this.checkOut - this.checkIn;
    const breakTime = this.breakStart && this.breakEnd ? this.breakEnd - this.breakStart : 0;
    this.workHours = Math.max(0, (workTime - breakTime) / (1000 * 60 * 60)); // Convert to hours
    this.breakHours = breakTime / (1000 * 60 * 60);
    
    // Calculate overtime (assuming 8 hours is standard work day)
    this.overtimeHours = Math.max(0, this.workHours - 8);
    
    return this.workHours;
  }
  return 0;
}

AttendanceSchema.methods.checkIfLate = function() {
  if (this.checkIn) {
    // Standard work start time is 9:00 AM
    const standardStartTime = new Date(this.date);
    standardStartTime.setHours(9, 0, 0, 0);
    
    if (this.checkIn > standardStartTime) {
      this.isLate = true;
      this.lateMinutes = Math.floor((this.checkIn - standardStartTime) / (1000 * 60));
      if (this.status === 'present') {
        this.status = 'late';
      }
    }
  }
}

// Pre-save middleware
AttendanceSchema.pre('save', function(next) {
  this.calculateWorkHours();
  this.checkIfLate();
  next();
});

const Attendance = mongoose.model("Attendance", AttendanceSchema);

export default Attendance