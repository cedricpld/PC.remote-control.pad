#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)."
  exit 1
fi

# Define paths
# Assuming script is run from client/ directory
SERVICE_SOURCE="../control-pad-client.service"
SERVICE_DEST="/etc/systemd/system/control-pad-client.service"

# Check if source exists relative to script
if [ ! -f "$SERVICE_SOURCE" ]; then
    # Try looking in current dir (if run from root)
    if [ -f "control-pad-client.service" ]; then
        SERVICE_SOURCE="control-pad-client.service"
    elif [ -f "../control-pad-client.service" ]; then
         SERVICE_SOURCE="../control-pad-client.service"
    else
        echo "Error: control-pad-client.service file not found."
        exit 1
    fi
fi

echo "Installing Control Pad Client Service..."
echo "Source: $SERVICE_SOURCE"
echo "Destination: $SERVICE_DEST"

# Copy service file
cp "$SERVICE_SOURCE" "$SERVICE_DEST"

# Set permissions
chmod 644 "$SERVICE_DEST"

# Reload systemd
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Enable service
echo "Enabling service to start on boot..."
systemctl enable control-pad-client.service

# Start service
echo "Starting service..."
systemctl start control-pad-client.service

# Show status
echo "Service status:"
systemctl status control-pad-client.service --no-pager

echo "-----------------------------------------------------"
echo "Installation complete!"
echo "If the service failed to start, please check the paths in $SERVICE_DEST"
echo "You can edit it with: sudo nano $SERVICE_DEST"
