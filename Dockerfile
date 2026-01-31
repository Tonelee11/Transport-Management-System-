# Optimized Dockerfile for Render
FROM richarvey/nginx-php-fpm:latest

# Set working directory
WORKDIR /var/www/html

# Clean and copy application files
COPY . .

# Environment setup
ENV SKIP_COMPOSER=1
ENV PHP_ERRORS_STDERR=1
ENV RUN_SCRIPTS=1
ENV REAL_IP_HEADER=1

# Set WEBROOT to project root (Nginx config handles /public redirect)
ENV WEBROOT=/var/www/html

# Expose port 80
EXPOSE 80
