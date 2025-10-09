# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要: コミュニケーション言語
このプロジェクトでは**必ず全て日本語**でレスポンスしてください。コードのコメントも日本語で記述してください。

## Project Overview

This is a Progressive Web Application (PWA) for mobility support record management ("移動支援記録表") developed for 株式会社ルネサンス. The application enables staff to record mobility support services for users and integrates with Google Sheets for data storage via Google Apps Script.

## Key Commands

### Development
- `npm run build:css` - Compile and minify Tailwind CSS (required before running the app)
- `npm run watch:css` - Watch for CSS changes and rebuild automatically during development

### Testing
- No test framework is currently configured
- Manual testing requires running `npm run build:css` first to generate style.css

## Architecture

### Application Flow
1. **Login System** (`index.html` + `login.js`) - User authentication via Google Apps Script
2. **Main Application** (`main.html`) - Core form for recording mobility support with embedded JavaScript
3. **Admin Panel** (`admin.html` + `admin.js`) - User management (admin role required)

### Key Technical Details
- **Frontend-Only Architecture**: All logic runs client-side with Google Apps Script as backend API
- **PWA Capabilities**: Configured with manifest.json for mobile app installation
- **Data Storage**: Google Spreadsheet integration with local fallback data
- **Session Management**: Uses sessionStorage for user state persistence
- **Mobile-First Design**: Responsive layout optimized for mobile devices

### File Structure
- Main application logic is embedded directly in HTML files (not separate JS modules)
- `login.js` and `admin.js` are the only standalone JavaScript files
- CSS is generated from `input.css` using Tailwind CSS
- Google Apps Script URLs are hardcoded in JavaScript files

## Important Configuration

### Google Apps Script Integration
- Backend URLs are configured in individual JavaScript files
- `admin.js:10` requires GAS_URL configuration (currently incomplete)
- Authentication and data operations depend on external Google Apps Script deployment

### Required Setup Steps
1. Run `npm run build:css` to generate missing `style.css` file
2. Configure Google Apps Script URLs in relevant files
3. Ensure Google Apps Script backend is deployed and accessible

### Development Notes
- The application uses vanilla JavaScript with no build pipeline beyond CSS compilation
- Form validation and user interactions are handled with inline JavaScript
- Data persistence relies entirely on Google Sheets integration
- No linting or testing tools are currently configured

## Japanese Language Context
- All user-facing text is in Japanese
- Form fields and validation messages use Japanese terminology
- Date/time handling uses Japanese locale formatting

code.gsとprocessBillingCodes.gsは連携先のグーグルスプレッドシートのApps Scriptに書かれたcodeです。