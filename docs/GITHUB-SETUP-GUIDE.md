# 🔧 GitHub Configuration Guide

## 📋 Step-by-Step Setup for CI/CD Pipeline

### 🌍 1. Configure GitHub Environments

#### 1.1 Create Staging Environment
1. Go to your repository: `https://github.com/ArielDRighi/ecommerce-monolith-foundation`
2. Click on **Settings** tab
3. In the left sidebar, click **Environments**
4. Click **New environment**
5. Name: `staging`
6. Configure **Deployment protection rules**:
   - ✅ **Required reviewers**: Add yourself as reviewer
   - ✅ **Wait timer**: 0 minutes
   - ✅ **Deployment branches**: Only deploy from `develop` branch

#### 1.2 Create Production Environment
1. Click **New environment** again
2. Name: `production`
3. Configure **Deployment protection rules**:
   - ✅ **Required reviewers**: Add yourself as reviewer
   - ✅ **Wait timer**: 5 minutes (optional safety delay)
   - ✅ **Deployment branches**: Only deploy from `main` branch

### 🔐 2. Configure Repository Secrets

Go to **Settings** → **Secrets and variables** → **Actions**

#### 2.1 Environment Variables (Repository level)
Click **New repository secret** for each:

```bash
# Database Production Secrets
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=ecommerce_catalog_prod
DB_USER=your-db-user
DB_PASSWORD=your-secure-db-password

# Redis Production Secrets
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password

# JWT Production Secrets (Generate strong secrets!)
JWT_SECRET=your-very-secure-jwt-secret-256-bits-long
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-256-bits-long

# CORS and Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Docker Registry (if using private registry)
DOCKER_REGISTRY=your-registry.com
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Notification Secrets (optional)
SLACK_WEBHOOK_URL=your-slack-webhook-url
DISCORD_WEBHOOK_URL=your-discord-webhook-url
```

#### 2.2 Environment-Specific Secrets

**For Staging Environment:**
1. Go to **Environments** → **staging** → **Add secret**

```bash
STAGING_DB_HOST=staging-db-host
STAGING_DB_PASSWORD=staging-db-password
STAGING_REDIS_PASSWORD=staging-redis-password
```

**For Production Environment:**
1. Go to **Environments** → **production** → **Add secret**

```bash
PROD_DB_HOST=production-db-host
PROD_DB_PASSWORD=production-db-password
PROD_REDIS_PASSWORD=production-redis-password
```

### 🔑 3. Generate Secure Secrets

Use these commands to generate secure secrets:

```bash
# Generate JWT Secret (256-bit)
openssl rand -base64 32

# Generate JWT Refresh Secret (256-bit)
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 24

# Generate Redis Password
openssl rand -base64 16
```

### ⚙️ 4. Repository Settings

#### 4.1 Branch Protection Rules
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals**: 1
   - ✅ **Dismiss stale PR approvals when new commits are pushed**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Require conversation resolution before merging**
   - ✅ **Include administrators**

3. Add rule for `develop` branch:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**

#### 4.2 Actions Permissions
1. Go to **Settings** → **Actions** → **General**
2. **Actions permissions**: Select "Allow all actions and reusable workflows"
3. **Workflow permissions**: Select "Read and write permissions"
4. ✅ **Allow GitHub Actions to create and approve pull requests**

### 📊 5. Workflow Verification Checklist

After configuration, verify:

- [ ] Staging environment exists with correct branch restrictions
- [ ] Production environment exists with approval requirements
- [ ] All required secrets are configured
- [ ] Branch protection rules are active
- [ ] Actions permissions are correctly set
- [ ] Dependabot is enabled and configured

### 🚀 6. Ready to Test!

Once configured, you can:

1. **Enable environments in workflows** by uncommenting the environment lines
2. **Create a Pull Request** from `feature/ci-cd-pipeline` to `develop`
3. **Watch the pipeline execute** all quality gates
4. **Verify deployment to staging** (if PR is merged to develop)
5. **Test production deployment** (if merged to main)

### 🔍 7. Monitoring and Troubleshooting

#### Common Issues:
- **Environment not found**: Ensure environment names match exactly (`staging`, `production`)
- **Secrets not accessible**: Check environment association and permissions
- **Approval required**: Ensure reviewers are configured and available
- **Branch restrictions**: Verify deployment branch settings

#### Monitoring:
- **Actions tab**: View pipeline execution and logs
- **Environments tab**: Monitor deployment history and status
- **Pull Requests**: Review automated checks and comments
- **Security tab**: Monitor Dependabot alerts and CodeQL results

---

## 🎯 Next Steps

1. Configure environments and secrets as described above
2. Uncomment environment lines in workflow files
3. Create and merge PR to test the complete pipeline
4. Monitor first production deployment
5. Set up monitoring and alerting for ongoing operations