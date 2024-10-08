#****************************************************#
# Dockerfile for Fragments project by Julia Alekseev # 
# Build and serve fragments                          #
#****************************************************#

# Specifying the base image 
FROM node

# Use node version 20.17.0
FROM node:20.17.0


LABEL maintainer="Julia Alekseev <jalekseev@myseneca.ca>"
LABEL description="Fragments node.js microservice"


# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false


# Use /app as our working directory
WORKDIR /app


# Copy the package.json and package-lock.json
# files into /app. NOTE: the trailing `/` on `/app/`, which tells Docker
# that `app` is a directory and not a file.
# Options:
#    1) Option 1: explicit path - Copy the package.json and package-lock.json > COPY package*.json /app/
#    2) Option 2: relative path - Copy the package.json and package-lock.json > COPY package*.json ./
#    3) Option 3: explicit filenames - Copy the package.json and package-lock.json > COPY package.json package-lock.json ./

# Explicit  path 
COPY package*.json /app/


# Install node dependencies defined in package-lock.json
RUN npm install


# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
#CMD npm start

#TO ASK:
CMD ["npm", "start"] 
#to prevent Docker to by pass the command line as the OP might not properly receive operating system signals ?????


# We run our service on port 8080
EXPOSE 8080
