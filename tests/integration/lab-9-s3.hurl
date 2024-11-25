#############################################################
# 1. Authenticated POST /v1/fragments - Create a Text Fragment
#############################################################
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`Hello S3!`

# 1. We expect to get back an HTTP 201
HTTP/1.1 201
[Asserts]
header "Location" matches "^http://localhost:8080/v1/fragments/[A-Za-z0-9_-]+$" 

[Captures]
url: header "Location"

# 2. Authenticated GET /v1/fragments/:id
########################################
GET {{url}}
[BasicAuth]
user1@email.com:password1

# 2.1 Response
# ============
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
[Asserts]
body == "Hello S3!"

# 3. Authenticated DELETE /v1/fragments/:id
###########################################
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# 3.1 Response
# ============
HTTP/1.1 200
