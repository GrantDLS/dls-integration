module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/user-office-core/apps/backend/src/$1',
    '^@dls/(.*)$': '<rootDir>/src/$1',
    '^tsyringe$': '<rootDir>/node_modules/tsyringe',
  },
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(spec|test))\\.[jt]sx?$',
  setupFilesAfterEnv: [
    '<rootDir>/user-office-core/apps/backend/src/config/dependencyConfigTest.ts',
  ],
  setupFiles: ['dotenv/config'],
  workerIdleMemoryLimit: 0.5,
};
