# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"] 