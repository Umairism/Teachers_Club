# 🚀 Deployment Guide

This guide covers deploying Teacher's Club to various platforms.

## Vercel (Recommended)

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/teachers-club)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   Add in Vercel dashboard:
   ```
   VITE_APP_NAME=Teacher's Club
   VITE_INVITE_CODE=TEACHERS2025
   ```

## Netlify

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables**
   ```
   VITE_APP_NAME=Teacher's Club
   VITE_INVITE_CODE=TEACHERS2025
   ```

## GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/teachers-club"
   }
   ```

3. **Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

## Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "run", "preview"]
   ```

2. **Build and run**
   ```bash
   docker build -t teachers-club .
   docker run -p 3000:3000 teachers-club
   ```

## Environment Configuration

### Production Environment Variables

```env
VITE_APP_NAME="Teacher's Club"
VITE_INVITE_CODE="TEACHERS2025"
VITE_SUPABASE_URL="your-production-url"
VITE_SUPABASE_ANON_KEY="your-production-key"
```

### Security Considerations

- Never commit `.env` files
- Use platform-specific secret management
- Rotate API keys regularly
- Enable HTTPS in production
