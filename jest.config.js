module.exports = {
  bail: 1,
  collectCoverage: true,

  coverageThreshold: {
    global: {
      branches: 100,
      statements: 100,
    },
  },

  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
};
