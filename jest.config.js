module.exports = {
  "verbose": true,
  "testMatch": [
    "**/?(*)+(Test).ts"
  ],
  "moduleFileExtensions": [
    "js",
    "jsx",
    "ts",
    "tsx"
  ],
  "transform": {
    "^.+\\.ts?$": "babel-jest",
    "^.+\\.ts$": "<rootDir>/node_modules/react-native/jest/preprocessor.js"
  }
};