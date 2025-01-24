# Stage 1: Install dependencies and build the project
FROM node:20-alpine AS build

# Install pnpm
RUN npm install -g pnpm
RUN npm install pm2 -g

# Set working directory
WORKDIR /app
# Copy the rest of the application source code
COPY . .
COPY update-version.sh ./
ARG TAG_VERSION=v0.0.0
ENV TAG_VERSION=$TAG_VERSION
ENV NODE_ENV=production
RUN chmod +x /app/update-version.sh
RUN sh /app/update-version.sh $TAG_VERSION

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Build the project
RUN cd apps/frontend && npx vite build -m production
RUN export NX_DAEMON=false; pnpm nx build api

# Stage 2: Create the final container with the dist and node_modules folders
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy node_modules and dist folder from the build stage
COPY --from=build /app/node_modules ./dist/node_modules
COPY --from=build /app/dist/ ./dist

# Expose the necessary port (change according to your app's port)
EXPOSE 3333

ENV NODE_ENV=production
WORKDIR /app/dist/apps

# Command to start your application
CMD ["api/main.js"]
