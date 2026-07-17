# vite-deploy

A small React and Vite application used to test repository import, production
builds, static hosting, optional server-side functions, and automatic
redeployment.

The repository intentionally contains no Dockerfile, GitHub Actions, registry
publishing, webhook notification, or infrastructure deployment configuration.
The hosting provider owns that lifecycle.

## What it exercises

- a locked npm install and production Vite build;
- static output written to `dist/`;
- optional server-side functions discovered in `nerdo/functions/`;
- managed PostgreSQL and S3-compatible object-storage checks;
- a visible page that can be changed to confirm a new commit was deployed.

## Local development

```bash
npm ci
npm run dev
```

## Production verification

```bash
npm run lint
npm run build
```

The normal npm scripts are application commands. Importing the repository,
building a platform image, assigning a domain, and monitoring the selected
branch are the hosting provider's responsibility.
