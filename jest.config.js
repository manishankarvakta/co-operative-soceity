module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  collectCoverage: true,
  coverageReporters: ["text", "html", "lcov"],
  collectCoverageFrom: [
    "src/services/BackupService.ts",
    "src/app/api/backups/**/*.ts"
  ]
};
