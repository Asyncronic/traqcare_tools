# Contributing to TraqCare Tools

Thank you for your interest in contributing to TraqCare Tools! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by a spirit of respect and collaboration. By participating, you are expected to uphold this standard. Please be respectful, inclusive, and constructive in all interactions.

## How Can I Contribute?

### Types of Contributions

We welcome many types of contributions:

- **Bug fixes** - Fix issues or incorrect behavior
- **New features** - Add new tools or capabilities
- **Documentation** - Improve README, guides, or code comments
- **Performance improvements** - Optimize existing code
- **Tests** - Add test coverage for existing features
- **UI/UX improvements** - Enhance the user interface and experience
- **Code refactoring** - Improve code quality and maintainability

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git for version control
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/traqcare-tools-site.git
   cd traqcare-tools-site
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/traqcare-tools-site.git
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Set up environment variables** (for FCM testing)
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
   ```

6. **Start the development servers**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm start
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

7. **Open your browser**
   - Navigate to `http://localhost:5173`
   - The app should load with all four tools available

## Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/websocket-support`)
- `fix/` - Bug fixes (e.g., `fix/tcp-timeout-issue`)
- `docs/` - Documentation updates (e.g., `docs/update-api-examples`)
- `refactor/` - Code refactoring (e.g., `refactor/connection-pool`)
- `test/` - Adding tests (e.g., `test/tcp-client-unit-tests`)

### Making Changes

1. **Make your changes** in logical, atomic commits
2. **Test your changes** thoroughly:
   - Test the specific feature you modified
   - Test related features that might be affected
   - Test on different browsers if UI changes were made
3. **Update documentation** if needed:
   - Update README.md for user-facing changes
   - Update CLAUDE.md for architecture changes
   - Add code comments for complex logic

### Commit Messages

Write clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "Add WebSocket support for real-time TCP streaming"
git commit -m "Fix timeout issue in persistent TCP connections"
git commit -m "Update README with UDP client documentation"

# Bad commit messages (avoid these)
git commit -m "fix bug"
git commit -m "updates"
git commit -m "WIP"
```

**Commit Message Format:**
```
<type>: <short description>

<optional longer description>

<optional footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat: Add support for TLS/SSL TCP connections

- Add TLS toggle option to TCP client UI
- Implement secure socket creation in backend
- Add certificate validation options
- Update documentation with TLS usage examples

Closes #123
```

## Coding Standards

### JavaScript/TypeScript

- **Formatting**: Use consistent indentation (2 spaces)
- **ES Modules**: Use `import/export` syntax (not `require`)
- **Async/Await**: Prefer async/await over promises and callbacks
- **Error Handling**: Always handle errors gracefully with try/catch
- **Comments**: Add comments for complex logic, but write self-documenting code when possible

### React/Frontend

- **Functional Components**: Use functional components with hooks (not class components)
- **State Management**: Use React hooks (`useState`, `useEffect`, etc.)
- **Props**: Use TypeScript interfaces for component props
- **Styling**: Use Tailwind CSS utility classes
- **Accessibility**: Ensure UI elements are accessible (ARIA labels, keyboard navigation)

### Backend

- **API Design**: Follow REST conventions for endpoints
- **Validation**: Validate all input data before processing
- **Error Responses**: Return consistent error structures
- **Logging**: Add appropriate logging for debugging
- **Security**: Never expose sensitive credentials to the frontend

### File Structure

When adding new files, follow the existing structure:

```
/backend
  /routes         → API route handlers (if splitting server.js)
  server.js       → Main Express server
  package.json

/frontend
  /src
    /components   → Reusable React components (if extracted from App.tsx)
    App.tsx       → Main application component
    main.tsx      → Entry point
  package.json
```

## Submitting Changes

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass (when tests are added to the project)
- [ ] Documentation is updated (README.md, CLAUDE.md, etc.)
- [ ] Commit messages are clear and descriptive
- [ ] Changes are focused on a single issue/feature
- [ ] No unrelated changes are included

### Creating a Pull Request

1. **Push your branch to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request on GitHub**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template (if available)

3. **PR Title Format**
   ```
   [Feature] Add WebSocket support for TCP streaming
   [Fix] Resolve timeout issue in persistent connections
   [Docs] Update contribution guidelines
   ```

4. **PR Description Should Include:**
   - **What**: Brief description of the changes
   - **Why**: Explanation of why the change is needed
   - **How**: Overview of how you implemented it
   - **Testing**: Steps to test the changes
   - **Screenshots**: For UI changes, include before/after screenshots
   - **Related Issues**: Reference any related issues (e.g., "Closes #123")

### Example PR Description

```markdown
## Description
Add support for TLS/SSL encrypted TCP connections to the TCP client tool.

## Motivation
Many production servers require encrypted connections. This feature allows users to test against TLS-enabled servers.

## Changes
- Added TLS toggle to TCP client UI
- Implemented `tls.connect()` in backend for secure connections
- Added certificate validation options
- Updated API endpoints to handle TLS flag
- Added documentation and usage examples

## Testing
1. Start a TLS-enabled test server on port 8443
2. Enable "Use TLS/SSL" toggle in TCP client
3. Connect to localhost:8443
4. Send a test packet
5. Verify encrypted connection is established

## Screenshots
![TLS Toggle UI](link-to-screenshot.png)

Closes #123
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged in release notes

## Reporting Bugs

### Before Submitting a Bug Report

- **Check existing issues** to see if it's already reported
- **Try the latest version** to see if it's already fixed
- **Gather information** about your environment

### How to Submit a Bug Report

Create an issue with the following information:

**Title**: Clear, descriptive title (e.g., "TCP connection hangs when timeout is set to 0")

**Description**:
```markdown
## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to TCP Client tab
2. Enter IP: 192.168.1.100, Port: 8080
3. Set timeout to 0
4. Click "Connect"
5. Connection hangs indefinitely

## Expected Behavior
Connection should either fail immediately or use a default timeout.

## Actual Behavior
Application becomes unresponsive, connection never times out.

## Environment
- OS: macOS 14.0
- Browser: Chrome 120
- Node.js: 18.17.0
- Backend Version: 1.0.0

## Screenshots/Logs
[Attach any relevant screenshots or error logs]

## Additional Context
This only happens when timeout is exactly 0. Any positive value works fine.
```

## Suggesting Enhancements

### Before Submitting an Enhancement

- **Check existing issues** for similar suggestions
- **Consider if it fits the project scope** (diagnostic tools for IoT/fleet management)
- **Think about implementation complexity** vs. benefit

### How to Submit an Enhancement Suggestion

Create an issue with the following information:

**Title**: Clear, descriptive title (e.g., "Add WebSocket client for real-time testing")

**Description**:
```markdown
## Enhancement Description
Add WebSocket client support as a sixth tool in the toolbox.

## Motivation
Many modern IoT devices and web applications use WebSocket for bidirectional real-time communication. Adding WebSocket support would make TraqCare Tools more comprehensive for testing real-time protocols.

## Proposed Solution
- Add new "WebSocket Client" tab to the UI
- Support connecting to WebSocket servers (ws:// and wss://)
- Send and receive text/binary messages
- Display real-time message stream
- Support custom headers and subprotocols
- Show connection events (open, close, error)
- Message history with timestamps

## Alternatives Considered
- Using browser DevTools (less user-friendly, no history)
- Command-line tools like wscat (not visual)
- Postman/Insomnia (requires separate application)

## Additional Context
- WebSocket is widely used in IoT dashboards, live tracking, and chat applications
- Complements existing TCP/UDP/MQTT tools for protocol testing
- Would use native browser WebSocket API (no backend proxy needed)
- Similar UI/UX to MQTT client with connect/disconnect flow

## Benefits
- Enables testing WebSocket-based IoT devices and services
- Allows debugging real-time web applications
- Provides unified interface alongside TCP/UDP/MQTT
- No backend changes needed (runs in browser)
```

## Questions?

If you have questions about contributing, feel free to:
- Open a discussion on GitHub
- Ask in the issue tracker
- Check the documentation (README.md, CLAUDE.md)

## Thank You!

Thank you for taking the time to contribute to TraqCare Tools! Your efforts help make this tool better for everyone in the IoT and fleet management community.

---

**License Note**: By contributing to this project, you agree that your contributions will be licensed under the MIT License, with copyright assigned to Huizhou Skywonder Technology Co., Ltd.
