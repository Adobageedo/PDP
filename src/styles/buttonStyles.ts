// Button style constants
export const buttonStyles = {
  // Primary buttons
  primary: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors',
  primaryLarge: 'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors',
  
  // Secondary buttons
  secondary: 'px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg flex items-center gap-2 transition-colors',
  secondaryDark: 'px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors',
  
  // Success/Accept buttons
  success: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors',
  
  // Danger/Delete buttons
  danger: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors',
  
  // Icon buttons
  iconPrimary: 'p-1 text-blue-600 hover:bg-blue-50 rounded',
  iconDanger: 'p-1 text-red-600 hover:bg-red-50 rounded',
  iconSecondary: 'p-1 text-gray-600 hover:bg-gray-50 rounded',
  iconSuccess: 'p-1 text-green-600 hover:bg-green-50 rounded',
  
  // Tab buttons
  tab: (isActive: boolean) => 
    `px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`,
};
