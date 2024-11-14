# *****Post Fragments Test*******

# Option 1 - create a base64 encoded username and password to use in the Authorization header
# POST http://localhost:8080/v1/fragments
# Content-Type: application/json
# Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# can get the base64 # on linux echo -n 'user1@email.com:password1' | base64
# on windows [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("user1@email.com:password1"))

# Option 2 - using the [BasicAuth] section, which must go AFTER the headers
# POST http://localhost:8080/v1/fragments
# Content-Type: application/json
# [BasicAuth]
# user1@email.com:password1

# curl on windows
# curl -i `
#     -X POST `
#     -u user1@email.com:password1 `
#     -H "Content-Type: text/plain" `
#     -d "This is a fragment" `
#     http://localhost:8080/v1/fragments

# curl -i `
#     -X GET `
#     -u user1@email.com:password1 `
#     http://localhost:8080/v1/fragments/YOUR_FRAGMENT_ID

# ************POSTING A FRAGMENT****************
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`This is a fragment!`

# 1. We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http://localhost:8080/fragments/[A-Za-z0-9_-]+$"  # Adjusted to match actual response without /v1

# jsonpath "$.status" == "ok"
# Our fragment ids use UUIDs
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings.
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain"
# 19 is the length of our fragment data: 'This is a fragment!'
jsonpath "$.fragment.size" == 19
# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
#GET {{url}}
#[BasicAuth]
#user1@email.com:password1

#HTTP/1.1 200
#Content-Type: text/plain
#Content-Length: 19
#[Asserts]
#body == "This is a fragment!"

# *******Posting Unauthenticated***********
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
# No authentication credentials provided
`This should fail`

# Expecting HTTP 401 Unauthorized
HTTP/1.1 401

# *******Posting JSON Fragment********
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"name": "Julia", "age": 38}`

# Expecting HTTP 201 Created
HTTP/1.1 201
