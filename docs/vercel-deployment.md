# Vercel Deployment Guide

## Environment Variables Required

### Required Environment Variables for Vercel

Add these to your Vercel project settings (Project Settings > Environment Variables):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Environment Variables by Environment

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://pr-123.vercel.app` | `https://yourdomain.com` |

## Build Configuration

### Node.js Version
- **Local**: Node.js 24.x
- **Vercel**: Node.js 18.x (specified in package.json engines)

### Build Commands
- **Install**: `npm install`
- **Build**: `npm run build`
- **Output**: `.next` directory

## Common Build Issues & Solutions

### 1. Node.js Version Mismatch
**Issue**: Local uses Node.js 24.x, Vercel uses 18.x
**Solution**: Added `engines` field to package.json

### 2. Environment Variables Missing
**Issue**: Build fails due to missing environment variables
**Solution**: Ensure all required variables are set in Vercel dashboard

### 3. Linting Errors
**Issue**: Vercel treats linting warnings as errors
**Solution**: Fix all linting warnings before deployment

### 4. Case Sensitivity
**Issue**: Import paths don't match file names (case-sensitive on Vercel)
**Solution**: Ensure all imports match exact file names

### 5. Build Cache Issues
**Issue**: Stale build cache causes failures
**Solution**: Clear Vercel build cache or redeploy

## Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] Node.js version specified in package.json
- [ ] All linting warnings fixed
- [ ] Build passes locally with `npm run build`
- [ ] No case sensitivity issues in imports
- [ ] All dependencies properly installed

## Troubleshooting

### Build Fails on Vercel but Works Locally

1. **Check Node.js version**: Ensure engines field is set
2. **Verify environment variables**: All required vars must be set
3. **Fix linting issues**: Run `npm run lint` and fix all warnings
4. **Check import paths**: Ensure case-sensitive imports match file names
5. **Clear build cache**: Redeploy without cache

### Performance Optimization

- Use `NODE_ENV=production` for optimized builds
- Enable Vercel Analytics for performance monitoring
- Configure proper caching headers
- Optimize images with Next.js Image component

## Monitoring

- **Vercel Dashboard**: Monitor deployments and performance
- **Function Logs**: Check serverless function execution
- **Analytics**: Track user behavior and performance metrics
