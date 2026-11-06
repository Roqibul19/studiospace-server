# StudioSpace Server

The Express and MongoDB API for StudioSpace, a marketplace for booking creative studios by the hour.

**Live API:** https://studiospace-server-snowy-eight.vercel.app

**Live site:** https://studiospace-client-navy-eta.vercel.app

**Client repository:** https://github.com/Roqibul19/studiospace-client

## Features

- Studio create, read, update and delete, with search, category filter and a top-rated list limited to 6.
- JWT verification from an HTTPOnly cookie, returning 401 for missing, invalid or expired tokens.
- Owner checks, so users can only change their own studios and bookings.
- Double-booking prevention against Confirmed bookings, with a 409 response and a clear message.
- Server-side booking prices and owner details, which a request cannot override.
- Booking statuses of Pending, Confirmed, Completed and Cancelled.

## Tech Stack

Node.js, Express 5, MongoDB, JSON Web Token, cookie-parser, CORS, dotenv and Vercel.

## API Routes

| Method | Route                              | Login | Purpose                                    |
| ------ | ---------------------------------- | ----- | ------------------------------------------ |
| GET    | `/api/studios`                     | No    | All studios, with `category` and `search`  |
| GET    | `/api/studios/featured`            | No    | The 6 top-rated studios                    |
| GET    | `/api/studios/:id`                 | No    | One studio                                 |
| GET    | `/api/studios/mine`                | Yes   | The logged-in user's studios               |
| POST   | `/api/studios`                     | Yes   | Add a studio                               |
| PATCH  | `/api/studios/:id`                 | Owner | Update a studio                            |
| DELETE | `/api/studios/:id`                 | Owner | Delete a studio                            |
| GET    | `/api/bookings/studio/:id/confirmed` | No  | Confirmed time slots for a studio          |
| POST   | `/api/bookings`                    | Yes   | Request a booking                          |
| GET    | `/api/bookings/mine`               | Yes   | Bookings the user has made                 |
| GET    | `/api/bookings/host`               | Yes   | Bookings for the user's studios            |
| PATCH  | `/api/bookings/:id/cancel`         | Renter | Cancel a pending booking                  |
| PATCH  | `/api/bookings/:id/confirm`        | Host  | Confirm a pending booking                  |
| PATCH  | `/api/bookings/:id/decline`        | Host  | Decline a pending booking                  |

## Local Setup

1. Clone the repository and install the packages:

   ```bash
   git clone https://github.com/Roqibul19/studiospace-server.git
   cd studiospace-server
   npm install
   ```

2. Create a `.env` file in the project folder:

   ```
   PORT=5000
   CLIENT_URL=http://localhost:3000
   DB_URI=your_mongodb_connection_string
   JWT_SECRET=the_same_value_as_on_the_client
   ```

3. Optionally add the sample studios:

   ```bash
   npm run seed
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

The API runs at http://localhost:5000.
