## FLOW

- client get initialized
- client sends email
- server verifies email
- server sends back verification code to the email and stores the code in redis with some expiry
- client checks his email
- enters the code and sends to the server
- server recieves the code and verifies it
  - if valid : mints a token and sends it back to the client
  - else : declines the request
- if token recieved - gets into dashboard
  - stores the token in localstorage and uses it incase of reconnection
- else if request denied - show error to client
- once into dashboard - have fun 🎉
