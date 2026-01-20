# Gorgias Flows Migrator - Documentation Index

Complete documentation index for the Gorgias Flows to AI Guidances migration tool.

## 🚀 Quick Start

**New User?** Start here:
1. [QUICK_START.md](QUICK_START.md) - Get up and running in 2 minutes
2. [CHECKLIST.md](CHECKLIST.md) - Step-by-step migration checklist

## 📚 Core Documentation

### [README.md](README.md)
**Comprehensive project documentation**

Covers:
- Features overview
- Installation instructions
- Configuration guide
- API endpoints reference
- Troubleshooting guide
- Project structure

**Read this for:** Complete understanding of the tool

---

### [QUICK_START.md](QUICK_START.md)
**Fast-track setup and usage guide**

Covers:
- 2-minute setup
- Finding your credentials
- Running dry-run tests
- Common issues

**Read this for:** Getting started quickly

---

### [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
**Technical overview and architecture**

Covers:
- What's included in the project
- Architecture diagram
- API endpoints used
- Migration flow
- Testing procedures
- Known issues

**Read this for:** Technical understanding

---

### [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)
**Real-world usage examples**

Covers:
- Step-by-step examples
- Command outputs
- Error scenarios
- Flow to Guidance conversions
- Troubleshooting commands

**Read this for:** Practical examples

---

### [CHECKLIST.md](CHECKLIST.md)
**Pre/post migration checklists**

Covers:
- Pre-migration setup checklist
- Migration execution checklist
- Post-migration validation
- Troubleshooting checklist
- Success criteria

**Read this for:** Ensuring complete migration

## 🔧 Configuration Files

### [.env.local](.env.local)
**Your credentials and configuration**
- ⚠️ Keep this file secure
- Never commit to version control
- Required for tool to work

### [.env.local.example](.env.local.example)
**Template for configuration**
- Copy to create [.env.local](.env.local)
- Shows all required variables

## 📦 Code Files

### Source Code ([src/](src/))

| File | Purpose |
|------|---------|
| [index.ts](src/index.ts) | Main entry point and CLI |
| [migrator.ts](src/migrator.ts) | Migration orchestration |
| [converter.ts](src/converter.ts) | Flow → Guidance conversion |
| [api-client.ts](src/api-client.ts) | Gorgias API HTTP client |
| [types.ts](src/types.ts) | TypeScript types & schemas |
| [config.ts](src/config.ts) | Environment config loader |
| [logger.ts](src/logger.ts) | Logging utility |
| [test-config.ts](src/test-config.ts) | Config testing script |

### Example Files

| File | Purpose |
|------|---------|
| [example-flow.json](example-flow.json) | Sample Flow structure and expected Guidance output |

## 🎯 Common Use Cases

### First Time User
1. Read [QUICK_START.md](QUICK_START.md)
2. Follow [CHECKLIST.md](CHECKLIST.md)
3. Reference [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) for commands

### Troubleshooting Issues
1. Check [README.md](README.md) Troubleshooting section
2. Review [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) Error Scenarios
3. Use [CHECKLIST.md](CHECKLIST.md) Troubleshooting checklist

### Understanding the Code
1. Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) Architecture section
2. Review source files in [src/](src/)
3. Check [example-flow.json](example-flow.json) for data structure

### Customizing Conversion
1. Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
2. Edit [src/converter.ts](src/converter.ts)
3. Test with [example-flow.json](example-flow.json)

## 📖 Reading Order

### For End Users (Non-Technical)
1. [QUICK_START.md](QUICK_START.md) - Setup and basic usage
2. [CHECKLIST.md](CHECKLIST.md) - Step-by-step migration
3. [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - Reference as needed

### For Developers
1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical overview
2. [README.md](README.md) - Complete documentation
3. Source code in [src/](src/)
4. [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - Testing examples

### For System Administrators
1. [README.md](README.md) - Full setup and configuration
2. [CHECKLIST.md](CHECKLIST.md) - Pre-flight checks
3. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - API endpoints and security

## 🔗 External Resources

### Gorgias Documentation
- [Gorgias Developer Portal](https://developers.gorgias.com/)
- [Gorgias REST API Guide](https://docs.gorgias.com/en-US/rest-api-208286)
- [Gorgias API Reference](https://developers.gorgias.com/reference/introduction)
- [AI Agent Documentation](https://docs.gorgias.com/en-US/intro-to-ai-agent-for-support-497772)

### Tool Development
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Zod Schema Validation](https://zod.dev/)

## 🆘 Getting Help

### Tool Issues
1. Review [README.md](README.md) Troubleshooting section
2. Check [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) error scenarios
3. Verify configuration with `npm run test-config`

### API Issues
1. Verify credentials in [.env.local](.env.local)
2. Test connectivity with `npm run test-config`
3. Contact Gorgias support if endpoints unavailable

### Configuration Issues
1. Review [QUICK_START.md](QUICK_START.md) Finding Your IDs section
2. Check [.env.local.example](.env.local.example) for required format
3. Run `npm run test-config` to validate

## 🗂️ Document Quick Reference

| Document | When to Use |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | First time setup |
| [CHECKLIST.md](CHECKLIST.md) | During migration |
| [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) | Need command examples |
| [README.md](README.md) | Comprehensive reference |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Technical details |
| [INDEX.md](INDEX.md) | Finding documentation |

## 📊 Document Statistics

- Total Documentation Files: 6
- Total Source Files: 8
- Total Lines of Documentation: ~2000+
- Configuration Files: 2
- Example Files: 1

## 🔄 Version Information

- **Tool Version**: 1.0.0
- **Documentation Version**: 1.0.0
- **Last Updated**: November 2025
- **Node.js Required**: 18+
- **TypeScript Version**: 5.7.2

---

**Need help?** Start with [QUICK_START.md](QUICK_START.md) or [README.md](README.md)
