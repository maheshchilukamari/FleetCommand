# GitHub Pages Deployment Guide

GitHub Pages can host the FleetCommand frontend, but it cannot run FastAPI or PostgreSQL. This project includes a static demo mode so the GitHub Pages version still works as a recruiter-facing portfolio app.

## What Works on GitHub Pages

- React frontend
- Hash-based routing
- Dashboard
- Live tracking with OpenStreetMap
- Demo vehicle data
- Route replay
- Drivers
- Assets
- Maintenance
- Alerts
- Reports
- FleetCommand Copilot
- Monitoring center

## What Requires Docker or a Hosted Backend

- FastAPI runtime
- PostgreSQL persistence
- Backend simulator persistence
- Real API writes
- Real database records

## Enable GitHub Pages

1. Push the repository to GitHub.
2. Open the GitHub repository.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push to the `main` branch.
6. The workflow `.github/workflows/deploy-pages.yml` builds and deploys the frontend.

## Local Static Build Test

From the project root:

```bash
cd frontend
npm install
$env:VITE_DEMO_MODE="true"
npm run build
npm run preview
```

Open the preview URL shown by Vite.

## Optional Mapbox Token

The app uses OpenStreetMap by default. To use Mapbox on GitHub Pages:

1. Go to repository **Settings > Secrets and variables > Actions**.
2. Add a repository secret:

```text
VITE_MAPBOX_TOKEN=your_token_here
```

3. Re-run the Pages workflow.

## Optional Hosted Backend

If you later deploy the FastAPI backend, set this in the Pages workflow:

```yaml
VITE_DEMO_MODE: "false"
VITE_API_URL: "https://your-api-domain.com"
```

The frontend will call the hosted backend and fallback to demo data only if the backend is unavailable.
