#****************************************************#
# Dockerfile for Fragments project by Julia Alekseev  #
# Build and serve fragments                           #
# Lab 6                                               #
#****************************************************#

# Use Node.js 20.18.0 with Alpine 3.19 as the base image
FROM node:20.18.0-alpine3.19@sha256:2d8c24d9104bda27e07dced6d7110aa728dd917dde8255d8af3678e532b339d6 AS base_img

#######################################################################

# Stage 0: Dependencies Setup
FROM base_img AS dependencies

# Set maintainer and description
LABEL maintainer="Julia Alekseev <jalekseev@myseneca.ca>"
LABEL description="Fragments node.js microservice"


# Install curl for health check
RUN apk add --no-cache curl=8.9.1-r1


# Default port 8080 
ENV PORT=8080

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable color when run inside Docker
ENV NPM_CONFIG_COLOR=false

# Use /app as working dir
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json /app/

# Install node dependencies defined in package-lock.json
RUN npm install

#######################################################################

# Stage 1: Copy Source Files and Build the Application

FROM dependencies AS builder

# Use /app as working dir
WORKDIR /app

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Change ownership of the working directory
RUN chown -R node:node /app

#######################################################################

# Stage 2: Run the Application

FROM builder AS deploy

# Expose the port for the app
EXPOSE 8080

# Switch to the node user
USER node

# Start the container by running the server
CMD ["npm", "start"]

# Health check to verify service is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:8080/ || exit 1
