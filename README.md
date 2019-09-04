# tao-test-runner-qti-fe

TAO Test Runner QTI implementation

## Install

```
npm i --save @oat-sa/tao-test-runner
```

## Development

Available scripts in the project:

- `npm run test <testname>`: run test suite
  - `testname` (optional): Specific test to run. If it is not provided, all will be ran.
- `npm run test:keepAlive`: start test server
- `npm run test:cov`: run `build:cov` and run tests
- `npm run test:dev`: test in development mode (watch changes and source maps)
- `npm run coverage`: show coverage report in terminal
- `npm run coverage:html`: show coverage report in browser
- `npm run build`: build for production into `dist` directory
- `npm run build:watch`: build for production into `dist` directory and watch for changes
- `npm run build:cov`: build for coverage into `dist` directory
- `npm run build:dev`: watch changes and build with source maps
- `npm run lint`: check syntax of code
