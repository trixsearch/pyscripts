server {
    listen 80;
    listen [::]:80;

    server_name codzelocal.com;

    location /org {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_request_headers on;
    }

    location /static {
        proxy_pass http://localhost:3000;
        proxy_pass_request_headers on;
    }

    location /sockjs-node/org {
        proxy_pass http://localhost:3000;
        proxy_pass_request_headers on;
        proxy_redirect off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    location /org/static {
        proxy_pass http://localhost:3000;
        proxy_pass_request_headers on;
    }

    location /candidate/static {
        proxy_pass http://localhost:5000;
        proxy_pass_request_headers on;
    }


    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_request_headers on;
    }


    location /designer {
        proxy_pass http://localhost:9001;
        proxy_set_header Host $host;
        #proxy_set_header X-Real-IP $remote_addr;
        #proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        #proxy_set_header X-Forwarded-Proto $scheme;
        #proxy_pass_request_headers on;
        proxy_set_header X-Forwarded-Host $host:$server_port;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /idm {
        proxy_pass http://localhost:9003;
        proxy_set_header Host $host;
        #proxy_set_header X-Real-IP $remote_addr;
        #proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        #proxy_set_header X-Forwarded-Proto $scheme;
        #proxy_pass_request_headers on;
        proxy_set_header X-Forwarded-Host $host:$server_port;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /rest {
        proxy_pass http://localhost:9002;
        proxy_set_header Host $host;
        #proxy_set_header X-Real-IP $remote_addr;
        #proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        #proxy_set_header X-Forwarded-Proto $scheme;
        #proxy_pass_request_headers on;
        proxy_set_header X-Forwarded-Host $host:$server_port;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}



server {
    if ($host = 'www.codzelocal.com') {
    return 301 http://codzelocal.com$request_uri;
    }

    server_name *.codzelocal.com;

    location /org {
        proxy_pass http://localhost:3000;
        proxy_pass_request_headers on;
        rewrite ^/$ /login permanent;
    }

    location /org/static {
        proxy_pass http://localhost:3000;
        proxy_pass_request_headers on;
    }


    location /candidate {
        proxy_pass http://localhost:5000;
        proxy_pass_request_headers on;
    }

    location /candidate/static {
        proxy_pass http://localhost:5000;
        proxy_pass_request_headers on;
    }

    location /sockjs-node/org {
        proxy_pass http://localhost:3000;
        proxy_pass_request_headers on;
        proxy_redirect off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    location /sockjs-node/candidate {
        proxy_pass http://localhost:5000;
        proxy_pass_request_headers on;
        proxy_redirect off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    location /api/bc_static {
        alias /home/vikram/src/onboard-backend/bc_static;
    }


    location /ezeurl {
        proxy_pass http://localhost:8000/api/ezeurl;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_request_headers on;
    }


    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_request_headers on;
    }


    location /ws/ {
        proxy_pass http://localhost:8000;
        #proxy_set_header Host $host;
        #proxy_set_header X-Real-IP $remote_addr;
        #proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        #proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        #proxy_read_timeout 86400;
        #proxy_redirect off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
