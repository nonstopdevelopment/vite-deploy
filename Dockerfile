FROM node:20-alpine
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build if necessary (e.g. for Vite or Next.js production/dev bundles)
RUN if grep -q '"build":' package.json; then npm run build; fi

# Expose port 3000 for all app types
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Unified start command:
# 1. Try "npm start" (best for Next.js/Node)
# 2. Try "npm run dev" (best for Vite/Next dev)
# 3. Fallback to "node index.js"
CMD ["sh", "-c", "if grep -q '"start":' package.json; then npm start; elif grep -q '"dev":' package.json; then npm run dev; else node index.js; fi"]