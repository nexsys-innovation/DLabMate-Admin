# DLabMate Admin

Independent React frontend for DLabMate platform administration. It can be deployed on an admin subdomain and communicates with the existing Express API.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `REACT_APP_API_URL` to the backend origin, without a trailing slash.
3. Run `npm install` and `npm start`.

The local app runs on port 3001. Add `http://localhost:3001` as `ADMIN_WEB_ORIGIN` in the backend `.env`.

## Production

Set `REACT_APP_API_URL=https://api.your-domain.com` in the hosting provider, then run `npm run build`. Deploy the generated `build` directory to the admin subdomain and set the backend `ADMIN_WEB_ORIGIN` to that exact HTTPS origin.

Firebase Admin credentials, the MongoDB connection string, and the JWT secret belong only in the backend environment. Do not add them to this frontend.
