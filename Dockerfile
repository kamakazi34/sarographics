FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/.git /usr/share/nginx/html/.github \
           /usr/share/nginx/html/.vercel /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/.dockerignore
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx","-g","daemon off;"]
