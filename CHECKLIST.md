# Migration Checklist

Use this checklist to ensure a successful Flows to Guidances migration.

## Pre-Migration Checklist

### ✅ Setup & Configuration

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Project dependencies installed (`npm install`)
- [ ] [.env.local](.env.local) file created from template
- [ ] Gorgias subdomain configured
- [ ] Gorgias API key obtained from Settings → REST API
- [ ] Gorgias username (email) added to config
- [ ] Help Center ID identified
- [ ] Store Integration ID identified

### ✅ Verification

- [ ] Configuration test passed (`npm run test-config`)
- [ ] Flows API returns data (check test-config output)
- [ ] Guidances API accessible (check test-config output)
- [ ] Dry run completed successfully (`DRY_RUN=true npm run migrate`)
- [ ] Dry run output shows expected flows
- [ ] Number of flows matches expectations

### ✅ Backup & Safety

- [ ] Exported existing flows from Gorgias (if applicable)
- [ ] Documented existing guidances count
- [ ] Created backup of [.env.local](.env.local)
- [ ] Tested with a single flow first (`npm run migrate <flow_id>`)
- [ ] Reviewed conversion output in dry run

## Migration Checklist

### ✅ Execution

- [ ] Set `DRY_RUN=false` in [.env.local](.env.local)
- [ ] Run migration (`npm run migrate`)
- [ ] Migration completed without errors
- [ ] All flows processed successfully
- [ ] No validation failures in output

### ✅ Verification After Migration

- [ ] Log into Gorgias Help Center
- [ ] Navigate to AI Guidances section
- [ ] Verify guidance count matches flows count
- [ ] Spot-check 3-5 guidances for accuracy
- [ ] Review guidance content formatting
- [ ] Confirm guidance keys are unique (format: `flow_{id}`)

## Post-Migration Checklist

### ✅ Validation

- [ ] Test AI Agent with migrated guidances
- [ ] Verify AI Agent uses guidances correctly
- [ ] Check for duplicate guidances
- [ ] Review guidance names for clarity
- [ ] Ensure all critical flows were migrated

### ✅ Cleanup & Documentation

- [ ] Document which flows were migrated
- [ ] Record migration date and results
- [ ] Note any flows that failed migration
- [ ] Update team documentation
- [ ] Archive flow backup

### ✅ Optimization (Optional)

- [ ] Edit guidance content for clarity
- [ ] Add additional context to guidances
- [ ] Test AI Agent performance with guidances
- [ ] Adjust guidance formatting if needed
- [ ] Train team on new guidance structure

## Troubleshooting Checklist

If you encounter issues, check:

### Configuration Issues
- [ ] All required environment variables are set
- [ ] API credentials are valid and not expired
- [ ] Subdomain matches your Gorgias account
- [ ] Help Center ID is correct
- [ ] Store Integration ID is correct

### API Issues
- [ ] Internet connection is stable
- [ ] Gorgias API is accessible
- [ ] API rate limits not exceeded
- [ ] Endpoints are available for your account
- [ ] Authentication credentials are correct

### Data Issues
- [ ] Flows exist in your Gorgias account
- [ ] Flow data structure matches expectations
- [ ] No invalid or corrupt flow data
- [ ] All required flow fields are present

### Import Issues
- [ ] Guidance format matches API requirements
- [ ] No duplicate guidance keys
- [ ] Content length within limits
- [ ] Valid JSON structure
- [ ] No special characters causing issues

## Quick Reference

### Test Commands
```bash
# Test configuration
npm run test-config

# Dry run all flows
DRY_RUN=true npm run migrate

# Dry run single flow
DRY_RUN=true npm run migrate <flow_id>

# Debug mode
LOG_LEVEL=debug npm run migrate
```

### Migration Commands
```bash
# Migrate all flows
npm run migrate

# Migrate single flow
npm run migrate <flow_id>

# Migrate with debug logging
LOG_LEVEL=debug npm run migrate
```

## Success Criteria

Migration is successful when:

✅ All flows fetched from API
✅ All flows converted to guidances
✅ All guidances pass validation
✅ All guidances imported successfully
✅ No errors in migration output
✅ Guidances visible in Gorgias Help Center
✅ AI Agent uses guidances correctly

## Rollback Plan

If migration fails or produces unexpected results:

1. **Stop Migration**: Cancel if running
2. **Review Errors**: Check logs for issues
3. **Contact Support**: Reach out to Gorgias if API issues
4. **Manual Cleanup**: Delete imported guidances if needed
5. **Fix Issues**: Address configuration/data problems
6. **Retry**: Run migration again after fixes

## Support Contacts

- **Tool Issues**: Check [README.md](README.md) troubleshooting
- **API Errors**: Contact Gorgias Support
- **Endpoint Questions**: Verify with Gorgias account team
- **Configuration Help**: Review [QUICK_START.md](QUICK_START.md)

---

**Last Updated**: November 2025
**Tool Version**: 1.0.0
