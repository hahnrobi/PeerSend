# Stage 1: Install dependencies and build the project
FROM node:20-alpine AS build

# Install pnpm
RUN npm install -g pnpm vite

# Set working directory
WORKDIR /app
# Copy the rest of the application source code
COPY . .
COPY ./.env.production ./.env
COPY update-version.sh ./
ARG TAG_VERSION=v0.0.0
ENV TAG_VERSION=$TAG_VERSION
ENV NODE_ENV=production
RUN chmod +x /app/update-version.sh
RUN sh /app/update-version.sh $TAG_VERSION

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile --prod false

# Build the project
RUN NODE_ENV=production pnpm nx build frontend --mode production
RUN export NX_DAEMON=false; pnpm nx build api

# Stage 2: Create the final container with the dist and node_modules folders
FROM node:20-alpine

# Set working directory
WORKDIR /app
RUN npm install -g pm2

# Copy node_modules and dist folder from the build stage
COPY --from=build /app/node_modules /app/dist/node_modules
COPY --from=build /app/dist/ /app/dist/
COPY --from=build /app/ecosystem.config.js /app/ecosystem.config.js

# Expose the necessary port (change according to your app's port)
EXPOSE 3333

ENV NODE_ENV=production
WORKDIR /app

# Command to start your application
CMD ["pm2-runtime", "ecosystem.config.js"]
