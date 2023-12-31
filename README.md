# PHP, MySQL, and MongoDB Docker Image

This Docker image provides a development environment for PHP applications with MySQL and MongoDB support.

## Requirements

- Docker
- Docker Compose

## Installation

1. Install Docker on your system by following the instructions for your operating system: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

2. Clone this repository to your local machine:

   ```
   git clone https://github.com/fernando-albar/docker-php_db-ex
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

1. Copy the `.env.example` file to `.env` and modify the environment variables as needed:
    ```
    cp .env.example .env
    ```
2. Start a container from the image:
   ```
   docker-compose up
   ```

   This will start a container with the name `my-php-app` and the image with the same name.

3. Open your web browser and navigate to `http://localhost` to see the PHP application running.

4. To stop the container, run the following command:

   ```
   docker stop my-php-app
   ```

   This will stop the container with the name `my-php-app`.

## Configuration

### Apache vhost file

The Apache vhost file is located at `config/apache.conf`. You can modify this file to configure your virtual host settings.

### PHP application files

The PHP application files are located at `src/`. You can modify these files to develop your PHP application.

### MySQL

The MySQL server is defined in the `docker-compose.yml` file. You can connect to the MySQL server using the following details:


```
Host: db Port: 3306 Database: myapp Username: root Password: password
```

Replace `<hostname>`, `<username>`, and `<password>` with your MySQL server details.


### MongoDB

The MongoDB server is defined in the `docker-compose.yml` file. You can connect to the MongoDB server using the following details:

```
Host: mongo Port: 27017 Database: myapp Username: root Password: password
```


The MongoDB driver is installed in the container. You can connect to a MongoDB server by using the `MongoDB\Client` class in your PHP code. See the [official MongoDB PHP library documentation](https://docs.mongodb.com/drivers/php/) for more information.