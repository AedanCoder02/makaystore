// Mock fixtures for Clerk users by role
const mockUsers = {
  admin: {
    id: 'user_admin_001',
    email: 'admin@makay.com',
    firstName: 'Admin',
    lastName: 'User',
    publicMetadata: { role: 'admin' },
  },
  supervisor: {
    id: 'user_sup_001',
    email: 'supervisor@makay.com',
    firstName: 'Supervisor',
    lastName: 'User',
    publicMetadata: { role: 'supervisor' },
  },
  worker: {
    id: 'user_worker_001',
    email: 'worker@makay.com',
    firstName: 'Worker',
    lastName: 'User',
    publicMetadata: { role: 'worker' },
  },
  customer: {
    id: 'user_cust_001',
    email: 'customer@makay.com',
    firstName: 'Customer',
    lastName: 'User',
    publicMetadata: { role: 'customer' },
  },
  unauthenticated: null,
};

let currentMockUser = mockUsers.admin;

const setMockUser = (role) => {
  currentMockUser = mockUsers[role] ?? null;
};

const useUser = jest.fn(() => ({
  user: currentMockUser,
  isLoaded: true,
  isSignedIn: currentMockUser !== null,
}));

const useAuth = jest.fn(() => ({
  userId: currentMockUser?.id ?? null,
  isLoaded: true,
  isSignedIn: currentMockUser !== null,
  sessionId: currentMockUser ? 'sess_001' : null,
}));

const useClerk = jest.fn(() => ({
  signOut: jest.fn(),
  openSignIn: jest.fn(),
}));

const SignedIn = ({ children }) => (currentMockUser ? children : null);
const SignedOut = ({ children }) => (!currentMockUser ? children : null);
const UserButton = () => null;
const SignInButton = ({ children }) => children;

const ClerkProvider = ({ children }) => children;

const auth = jest.fn(() => ({
  userId: currentMockUser?.id ?? null,
  sessionId: currentMockUser ? 'sess_001' : null,
}));

const currentUser = jest.fn(() => Promise.resolve(currentMockUser));

module.exports = {
  useUser,
  useAuth,
  useClerk,
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  ClerkProvider,
  auth,
  currentUser,
  // Test helpers
  __setMockUser: setMockUser,
  __mockUsers: mockUsers,
};
