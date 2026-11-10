# --- build the React app ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Relative URL: the browser calls the same host it loaded the page from, so it works on
# localhost and on any host without configuration.
ARG VITE_API_URL=/backend/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- serve it with nginx, proxying /backend to the Laravel container ---
FROM nginx:1.27-alpine
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
