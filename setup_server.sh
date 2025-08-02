#!/bin/bash

set -e

if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

echo "=== Web Server Setup for Upload Practice ==="

read -p "Enter user number (e.g., 001): " USER_NUM
if [[ ! "$USER_NUM" =~ ^[0-9]{3}$ ]]; then
    echo "Error: Please enter a 3-digit number"
    exit 1
fi

USERNAME="user$USER_NUM"
HOME_DIR="/home/$USERNAME"
WEB_DIR="/var/www/$USERNAME/m1/public"

echo "Creating user: $USERNAME"

if id "$USERNAME" &>/dev/null; then
    echo "User $USERNAME already exists"
else
    useradd -m -s /bin/bash "$USERNAME"
    echo "User $USERNAME created"
fi

read -s -p "Set password for $USERNAME: " PASSWORD
echo
echo "$USERNAME:$PASSWORD" | chpasswd
echo "Password set successfully"

mkdir -p "$WEB_DIR"
chown -R "$USERNAME:$USERNAME" "/var/www/$USERNAME"
chmod 755 "/var/www/$USERNAME"
chmod 755 "/var/www/$USERNAME/m1"
chmod 755 "$WEB_DIR"

cat > "$WEB_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$USERNAME's Page</title>
</head>
<body>
    <h1>$USERNAME's Web Page</h1>
    <p>Welcome to the upload practice server!</p>
    <p>This page is accessible at http://m1.$USERNAME.jyakunen2024.m5a.jp/</p>
</body>
</html>
EOF

chown "$USERNAME:$USERNAME" "$WEB_DIR/index.html"

if [ -d "/etc/apache2/sites-available" ]; then
    # Debian/Ubuntu Apache configuration
    VHOST_FILE="/etc/apache2/sites-available/$USERNAME.conf"
    cat > "$VHOST_FILE" << EOF
<VirtualHost *:80>
    ServerName m1.$USERNAME.jyakunen2024.m5a.jp
    DocumentRoot $WEB_DIR
    
    <Directory $WEB_DIR>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog \${APACHE_LOG_DIR}/$USERNAME_error.log
    CustomLog \${APACHE_LOG_DIR}/$USERNAME_access.log combined
</VirtualHost>
EOF
    a2ensite "$USERNAME.conf"
    
elif [ -d "/etc/httpd/conf.d" ]; then
    # RHEL/CentOS/Amazon Linux Apache configuration
    VHOST_FILE="/etc/httpd/conf.d/$USERNAME.conf"
    cat > "$VHOST_FILE" << EOF
<VirtualHost *:80>
    ServerName m1.$USERNAME.jyakunen2024.m5a.jp
    DocumentRoot $WEB_DIR
    
    <Directory $WEB_DIR>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog /var/log/httpd/$USERNAME_error.log
    CustomLog /var/log/httpd/$USERNAME_access.log combined
</VirtualHost>
EOF
else
    echo "Error: Could not find Apache configuration directory"
    exit 1
fi

if systemctl is-active --quiet httpd; then
    systemctl reload httpd
elif systemctl is-active --quiet apache2; then
    systemctl reload apache2
elif systemctl list-unit-files | grep -q httpd.service; then
    systemctl start httpd
elif systemctl list-unit-files | grep -q apache2.service; then
    systemctl start apache2
else
    echo "Error: Could not find Apache service"
    exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo "User: $USERNAME"
echo "Web Directory: $WEB_DIR"
echo "URL: http://m1.$USERNAME.jyakunen2024.m5a.jp/"
echo ""
echo "SSH Connection:"
echo "ssh $USERNAME@server_ip"
echo ""
echo "File Upload Directory: $WEB_DIR"