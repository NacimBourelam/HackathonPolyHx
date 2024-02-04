FROM nginx:1.25.3-alpine3.18-perl

COPY *.html *.js *.css Logo.png /usr/share/nginx/html/

EXPOSE 80