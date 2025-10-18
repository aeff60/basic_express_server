import User from "../models/User.js"

const userService = {
  getAllUsers: async () => {
    return await User.find({ isActive: true }).select('-password');
  },
  getUserById: async (id) => {
    return await User.findById(id).select('-password'); 
  },
  getByUsername: async (name) => {
    return await User.findOne({ name: name });
  },
  getByEmployeeId: async (employeeId) => {
    return await User.findOne({ employeeId: employeeId });
  },
  getByEmail: async (email) => {
    return await User.findOne({ email: email });
  },
  create: async(userData) => {
    return await User.create(userData);
  },
  updateUser: async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  },
  deactivateUser: async (id) => {
    return await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password');
  },
  getUsersByDepartment: async (department) => {
    return await User.find({ department: department, isActive: true }).select('-password');
  }
}

export default userService