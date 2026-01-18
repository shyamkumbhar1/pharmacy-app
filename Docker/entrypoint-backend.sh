#!/bin/bash
# #region agent log
echo "{\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\",\"location\":\"entrypoint-backend.sh:3\",\"message\":\"Container started - checking vendor after volume mount\",\"data\":{\"vendor_exists\":$(test -d /var/www/html/vendor && echo true || echo false),\"autoload_exists\":$(test -f /var/www/html/vendor/autoload.php && echo true || echo false),\"html_dir_contents\":\"$(ls -la /var/www/html | head -10 | tr '\n' ' ')\"},\"timestamp\":$(date +%s000)}" >> /home/india/shared/solominds/Cv\ Projects/Farma\ mangment\ system/.cursor/debug.log || true
# #endregion

# If vendor doesn't exist, install dependencies
if [ ! -d "/var/www/html/vendor" ]; then
    # #region agent log
    echo "{\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\",\"location\":\"entrypoint-backend.sh:8\",\"message\":\"Vendor missing - running composer install\",\"data\":{},\"timestamp\":$(date +%s000)}" >> /home/india/shared/solominds/Cv\ Projects/Farma\ mangment\ system/.cursor/debug.log || true
    # #endregion
    cd /var/www/html
    composer install --no-dev --optimize-autoloader --no-scripts
    # #region agent log
    echo "{\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\",\"location\":\"entrypoint-backend.sh:12\",\"message\":\"After composer install in entrypoint\",\"data\":{\"vendor_exists\":$(test -d /var/www/html/vendor && echo true || echo false),\"autoload_exists\":$(test -f /var/www/html/vendor/autoload.php && echo true || echo false)},\"timestamp\":$(date +%s000)}" >> /home/india/shared/solominds/Cv\ Projects/Farma\ mangment\ system/.cursor/debug.log || true
    # #endregion
fi

exec php-fpm
