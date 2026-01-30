# Dockerfile for Render deployment
FROM richarvey/nginx-php-fpm:3.1.6

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Copy custom Nginx configuration
# The image expects custom config in /etc/nginx/sites-available/default.conf 
# or we can use the image's feature to load from a specific path.
COPY docker/nginx/default.conf /etc/nginx/sites-available/default.conf

# Environment setup
ENV SKIP_COMPOSER=1
ENV PHP_ERRORS_STDERR=1
ENV RUN_SCRIPTS=0
ENV REAL_IP_HEADER=1

# Configure Nginx for the app structure
ENV WEBROOT=/var/www/html

# Expose port 80
EXPOSE 80
