/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    // CSS/style imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Path aliases (tsconfig paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    // Static file imports
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__tests__/mocks/fileMock.js',
    // next-intl mock
    '^next-intl$': '<rootDir>/__tests__/mocks/nextIntl.js',
    '^next-intl/(.*)$': '<rootDir>/__tests__/mocks/nextIntl.js',
    // next/navigation mock
    '^next/navigation$': '<rootDir>/__tests__/mocks/nextNavigation.js',
    // next/link mock
    '^next/link$': '<rootDir>/__tests__/mocks/nextLink.js',
    // animejs mock
    '^animejs$': '<rootDir>/__tests__/mocks/animejs.js',
    // ShaderGradient mock
    '^@shadergradient/react$': '<rootDir>/__tests__/mocks/shaderGradient.js',
    // three mock
    '^three$': '<rootDir>/__tests__/mocks/three.js',
    '^@react-three/(.*)$': '<rootDir>/__tests__/mocks/reactThree.js',
    // Internal ShaderGradientCanvas wrapper
    '^@/components/ShaderGradientCanvas$': '<rootDir>/__tests__/mocks/shaderGradientCanvas.js',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        ['@babel/preset-typescript'],
      ],
    }],
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/__tests__/mocks/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/stores/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 60,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  // Transform zustand and other ESM packages
  transformIgnorePatterns: [
    '/node_modules/(?!(zustand|@clerk|lenis|animejs|@fiddle-digital)/)',
  ],
};

module.exports = config;
