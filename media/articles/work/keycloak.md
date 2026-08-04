# KEYCLOAK [^](/articles/)

## Setting up development environment for KeyCloak

### Step-by-step guide

The following steps are required to follow:

1. Clone repository: https://code.#######.com/codema/iam/Keycloak
2. As per the readme file in the repo, run the command on the gitbash/shell: sh
   replace-root-url.sh http://localhost:4200
3. Add the attached docker-compose file in the folder where Keycloak is cloned.
   The image tag version can be changed if required. docker-compose.yml
4. Run docker compose up on command prompt.
5. Once the container is running, open http://localhost:8080.
6. Landing page of Keycloak see PDF
7. Go to Administration Console, and give username and password as "admin".
8. Click on Realm and create a new realm
9. REALM see PDF
10. Browse the file : <path-to-repository>/realm-config/###-realm.json.
11. click create see PDF with: Resource file >> ###-realm.json Realm name = ###
    Enabled = ON
12. Select the "### realm, as by default Master will be selected.
13. Add user for the realm ###.
14. List new users
15. Create a user as shown in example Email = test@test.com First name = test
    Last name = test
16. Once user is created, add password credentials.
17. Set the password as shown in example: 'test;
18. Now run the API to get the access token as example (curl -X POST -d
    "client_id=###" -d "username=test@test.com" -d "password=test" -d
    "grant_type=password"
    localhost:8080/realms/###/protocol/openid-connect/token)
19. In the API, the parameters are as mentioned : curl -X POST -d
    "client_id=<client>" -d "username=<username>" -d "password=<password>" -d
    "grant_type=password"
    localhost:8080/realms/<realm>/protocol/openid-connect/token

---

S ID Keycloak validate token redirect requests with token in auth header API
Gateway Requests including token in auth header UI or other client Query Data
for tenant cloud services database Get Token Requests including token in auth
header discovery agent use as identity provider Get Token extract tenant
information from token

Auth server = keycloak

Instead of using its own internal/external identity provider, S ID will be
integrated with keycloak as identity provider.

---

## UI or web client (Browser):

- User opens ### UI
- User is redirected to keycloak login page
- User provide credentials.
- If authentication is successful, client receives an access token & will be
  redirected to ### UI.
- All further calls to application should have this access token.
- API gateway when receives request, will validate token from keycloak
  introspect token endpoint.
- If the token is valid, the request will further propagate to downstream(cloud)
  services, otherwise the request will be rejected with 401 status.
- (The management of access token completely depend on how a developer has
  implemented the application logic to store & use the token)

## Web server (backend service):

- App requests for authorization code to keycloak auth endpoint with grant type
  auth
- App receives auth code
- App requests for access token to keycloak token endpoint with generated auth
  code & credentials
- App receives access token & refresh token
- All further calls to API gateway should contain this access token.
- API gateway when receives request, will validate token from keycloak
  introspect token endpoint.
- If the token is valid, the request will further propagate to downstream(cloud)
  services, otherwise the request will be rejected with 401 status.
- Access token has a limited, pre-set expiration time.
- When an access token expires, refresh token can be used to generate a new
  access token without generating auth code.
