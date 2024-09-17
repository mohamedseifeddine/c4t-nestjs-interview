module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
    testTimeout: 15000,
    transform: {
        '.': ['ts-jest', {isolatedModules: true}]
    }
};
