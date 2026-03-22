# Use Node base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy dependencies first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all code
COPY . .

# Expose port (important for documentation)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]