FROM php:7.4-apache

# Install the PHP extensions we need
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install PHP zip extension
RUN apt-get update && apt-get install -y \
    zlib1g-dev \
    libzip-dev \
    unzip \
    git \
&& docker-php-ext-install zip

# Install PHP dotenv
RUN composer require vlucas/phpdotenv


# Install MongoDB driver
RUN pecl install mongodb && \
    docker-php-ext-enable mongodb

# Install MySQL client
RUN apt-get update && \
    apt-get install -y default-mysql-client

# Copy Apache vhost file to proxy PHP requests to PHP-FPM container
COPY ./apache.conf /etc/apache2/sites-available/000-default.conf

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Copy PHP application files
COPY ./src/ /var/www/html/

# Set working directory
WORKDIR /var/www/html/