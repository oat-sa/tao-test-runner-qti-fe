# tao-test-runner-qti-fe

TAO Test Runner QTI implementation

## Install

```
npm i --save @oat-sa/tao-test-runner
```

## Development

Available scripts in the project:

-   `npm run test <testname>`: run test suite
    -   `testname` (optional): Specific test to run. If it is not provided, all will be ran.
-   `npm run test:keepAlive`: start test server
-   `npm run test:cov`: run `build:cov` and run tests
-   `npm run test:dev`: test in development mode (watch changes and source maps)
-   `npm run coverage`: show coverage report in terminal
-   `npm run coverage:html`: show coverage report in browser
-   `npm run build`: build for production into `dist` directory
-   `npm run build:watch`: build for production into `dist` directory and watch for changes
-   `npm run build:cov`: build for coverage into `dist` directory
-   `npm run build:dev`: watch changes and build with source maps
-   `npm run build:all`: build `scss` files to `css` files, build for production into `dist` directory
-   `npm run build:scss`: build `scss` files to `css` files
-   `npm run lint:src`: check syntax of code
-   `npm run lint:test`: check syntax of code in the unit tests
-   `npm run lint:report`: build a syntax check report
