const ALWAYS_IGNORE = [
  '<rootDir>/dist',
  '/node_modules/'
];

module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ALWAYS_IGNORE,
  coveragePathIgnorePatterns: ALWAYS_IGNORE
};
