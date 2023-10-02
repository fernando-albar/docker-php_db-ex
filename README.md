# PHP, MySQL, and MongoDB Docker Image

This Docker image provides a development environment for PHP applications with MySQL and MongoDB support.

## Installation

1. Install Docker on your system by following the instructions for your operating system: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

2. Clone this repository to your local machine:

   ```
   git clone https://github.com/your-username/your-repo.git
   ```

3. Navigate to the directory where the `Dockerfile` is located:

   ```
   cd your-repo
   ```

4. Build the Docker image:

   ```
   docker build -t my-php-app .
   ```

   This will build the Docker image with the name `my-php-app`.

## Usage

1. Start a container from the image:

   ```
   docker run -d -p 80:80 --name my-php-app my-php-app
   ```

   This will start a container with the name `my-php-app` and the image with the same name.

2. Open your web browser and navigate to `http://localhost` to see the PHP application running.

3. To stop the container, run the following command:

   ```
   docker stop my-php-app
   ```

   This will stop the container with the name `my-php-app`.

## Configuration

### Apache vhost file

The Apache vhost file is located at `/etc/apache2/sites-available/000-default.conf`. You can modify this file to configure your virtual host settings.

### PHP application files

The PHP application files are located at `/var/www/html/`. You can modify these files to develop your PHP application.

### MySQL

The MySQL client is installed in the container. You can connect to a MySQL server by running the following command:

```
mysql -h <hostname> -u <username> -p<password>
```

Replace `<hostname>`, `<username>`, and `<password>` with your MySQL server details.

### MongoDB

The MongoDB driver is installed in the container. You can connect to a MongoDB server by using the `MongoDB\Client` class in your PHP code. See the [official MongoDB PHP library documentation](https://docs.mongodb.com/drivers/php/) for more information for more information.