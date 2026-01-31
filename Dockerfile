# Standardized Dockerfile for Render (Pinned Version)
FROM richarvey/nginx-php-fpm:3.1.6

# Set working directory
WORKDIR /var/www/html

# Clean and copy application files
COPY . .

# AUTHORITATIVE Nginx configuration
COPY conf/nginx/nginx-site.conf /etc/nginx/sites-available/default.conf
RUN ln -sf /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf

# Environment setup
ENV SKIP_COMPOSER=1
ENV PHP_ERRORS_STDERR=1
ENV RUN_SCRIPTS=1
ENV REAL_IP_HEADER=1
ENV WEBROOT=/var/www/html/public

# Expose port 80
EXPOSE 80
