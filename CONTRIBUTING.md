# Contributing to Ark Cross-Server Chat

Thank you for considering contributing to Ark Cross-Server Chat! We welcome contributions from the community.

## 🤝 How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Include detailed information**:
   - Operating system and Node.js version
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Log files and error messages
   - Screenshots if applicable

### Suggesting Features

1. **Check the roadmap** for planned features
2. **Use the feature request template**
3. **Provide clear use cases** and benefits
4. **Include mockups or examples** if helpful

### Pull Requests

1. **Fork the repository** and create a feature branch
2. **Follow the coding standards** outlined below
3. **Test your changes** thoroughly
4. **Update documentation** if necessary
5. **Write clear commit messages**

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+
- Git
- Text editor/IDE of choice

### Local Development

1. **Clone your fork:**
```bash
git clone https://github.com/zarar2312/ark-cross-server-chat.git
cd ark-cross-server-chat
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create configuration:**
```bash
cp config.example.json config.json
# Edit config.json with your test server details
```

4. **Start development server:**
```bash
npm run dev
```

5. **Run tests:**
```bash
npm test
```

### Testing

- **Unit Tests:** Run `npm test`
- **RCON Tests:** Use `npm run test:rcon`
- **Chat Tests:** Use `npm run test:chat`
- **Character Tests:** Use `npm run test:chars`

## 📝 Coding Standards

### JavaScript Style Guide

- **ES6+ features** preferred
- **2 spaces** for indentation
- **Semicolons** required
- **Single quotes** for strings
- **Camel case** for variables and functions
- **Pascal case** for classes

### Example:
```javascript
const serverManager = {
  connect: async (server) => {
    try {
      const connection = await rcon.connect(server.host, server.port);
      return connection;
    } catch (error) {
      logger.error(`Failed to connect to ${server.name}:`, error);
      throw error;
    }
  }
};
```

### File Structure

```
src/
├── arkServer.js          # Individual server management
├── arkChatManager.js     # Chat coordination
├── logger.js            # Logging utilities
└── webController.js     # Web routes and socket handling

views/
├── index.ejs           # Main chat interface
└── admin.ejs           # Admin panel

public/
├── css/style.css       # Main stylesheet
└── js/
    ├── main.js         # Client-side chat logic
    └── admin.js        # Admin panel logic

scripts/
└── test-*.js          # Test utilities
```

### CSS Guidelines

- **Mobile-first** responsive design
- **CSS custom properties** for theming
- **BEM methodology** for class naming
- **Bootstrap utilities** when appropriate

### Commit Message Format

```
type(scope): brief description

Detailed explanation if necessary

- List any breaking changes
- Reference issues: Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Build/config changes

## 🚀 Project Structure

### Core Components

1. **ArkServer** - Individual server connection management
2. **ArkChatManager** - Cross-server coordination
3. **WebController** - HTTP and WebSocket handling
4. **Logger** - Centralized logging system

### Key Features

- **RCON Communication**: Using `rcon` npm package
- **Real-time Updates**: Socket.IO for live chat
- **Responsive UI**: Bootstrap 5 with custom CSS
- **Turkish Support**: Full UTF-8 encoding
- **Docker Ready**: Multi-stage builds

## 📋 Review Process

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Screenshots for UI changes
- [ ] Performance impact considered

### Review Criteria

1. **Functionality**: Does it work as expected?
2. **Code Quality**: Is it readable and maintainable?
3. **Performance**: Any negative impact?
4. **Security**: No vulnerabilities introduced?
5. **Documentation**: Adequate explanations?

## 🏆 Recognition

Contributors will be recognized in:
- GitHub contributors list
- README.md acknowledgments
- Release notes for significant contributions

## 📞 Getting Help

- **Discord**: Join our community server
- **Issues**: Use GitHub issues for questions
- **Discussions**: Use GitHub discussions for ideas
- **Wiki**: Check the project wiki

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
