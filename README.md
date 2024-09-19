# Fragments Back-end API

## Table of Contents

- [Project Setup](#project-setup)
- [Scripts](#scripts)
  - [Start](#start)
  - [Dev](#dev)
  - [Debug](#debug)
  - [Lint](#lint)
- [Running the Server](#running-the-server)
- [Debugging](#debugging)
- [Testing](#testing)
- [Notes](#notes)

## Project Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/JulAleks/fragments.git
   cd fragments
   ```

2. **Install Dependencies**:

   Make sure you have Node.js installed. Then, install the required dependencies by running:

   ```bash
   npm install
   ```

3. **Setting Up Environment Variables**:

   Ensure you have any required environment variables set up for your project. For example:

   ```bash
   LOG_LEVEL=debug
   ```

## Scripts

### Start

This command starts the server normally (without live-reload or debugging):

```bash
npm start
```

This runs the application in production mode using the following:

```bash
node src/server.js
```

By default, the server will run on port 8080. You can access the application at:

```
http://localhost:8080
```

### Dev

To run the server in development mode with **nodemon** (which watches for changes in the `src/` folder and automatically restarts the server when files are updated), use:

```bash
npm run dev
```

This runs the server and watches for changes:

```bash
nodemon src/server.js --watch src
```

### Debug

If you want to start the server and attach a debugger to it, run:

```bash
npm run debug
```

This command runs the server with the **Node.js Inspector** enabled on port `9229` for debugging:

```bash
nodemon --inspect=0.0.0.0:9229 src/server.js --watch src
```

You can connect a debugger (e.g., in VSCode or Chrome) to this port.

### Lint

Run ESLint to check your code for issues:

```bash
npm run lint
```

This runs ESLint on all JavaScript files in the `src/` folder:

```bash
eslint ./src/**/*.js
```

You can also fix linting issues automatically:

```bash
npm run lint -- --fix
```

## Running the Server

- **Production**: Use `npm start` for production.
- **Development**: Use `npm run dev` to run the server in development mode with automatic restarts.
- **Debugging**: Use `npm run debug` to start the server with debugging enabled.

## Debugging

1. **VSCode Setup**:

   Make sure you have the `launch.json` file set up in the `.vscode` folder. To start debugging:

   - Open **Run and Debug** (`Ctrl + Shift + D`).
   - Select **Debug via npm run debug**.
   - Press **F5** or click **Start Debugging**.

   You can now use breakpoints and inspect the server via the Node.js Inspector running on port `9229`.

2. **Using Chrome DevTools**:

   - Open Chrome and go to `chrome://inspect`.
   - Click **Open dedicated DevTools for Node** to connect to the server’s inspector.

## Testing

- **Unit Testing**:

  Unit tests are run locally and through GitHub Actions using Continuous Integration (CI). GitHub automatically runs tests on pull and push requests and will notify if any code breaks.

  Locally, you can run `npm test` to execute the tests, or `npm run coverage` to get detailed information. Alternatively, you can open the coverage report in a browser by running:

  ```bash
  start coverage/lcov-report/index.html
  ```

- **Basic Authentication Testing**:

  Basic authentication is done using a local "fake" pool of users stored in a `.htpasswd` file. This file contains hashed credentials for testing authentication routes.

## Notes

- **Ports**:

  - The server runs on port `8080` by default.

- **Environment Variables**:

  Ensure any necessary environment variables (like `LOG_LEVEL`) are properly configured when running the server or debugging.
