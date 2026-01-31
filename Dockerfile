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

# Use image's built-in WEBROOT feature to auto-configure Nginx
# This points the domain root directly to our public folder
ENV WEBROOT=/var/www/html/public

# Expose port 80
EXPOSE 80
