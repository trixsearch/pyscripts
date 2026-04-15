# Stage 1 - the build process
FROM node:8.15.1-alpine as build-deps
WORKDIR /code
COPY ezedoc-frontend-react/ /code/
COPY ezedox-dev-nginx.conf /
RUN npm install && npm run build

# Stage 2 - the production environment
FROM nginx:1.14-alpine
RUN rm /etc/nginx/conf.d/* && mkdir -p /var/www/html/ezedox_build
COPY ezedox-dev-nginx.conf /etc/nginx/conf.d/
COPY --from=build-deps /code/build /var/www/html/ezedox_build
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]