# Coding 4 Tomorrow NestJS Interview

# How to complete the test

## ☑️ Instructions

### 1. Create a JWT authentication system with the following routes:
  - Register
  - Login

  **User model:**
  - email: string, unique
  - password: string, min 8 characters, one uppercase, one lowercase, one number, one special character
  - role: enum ('user', 'admin')

### 2. CRUD of movies with the following fields:
- title: min 2 chars, max 120 chars
- description: min 20 chars, max 500 chars
- releaseDate: accept only dates in the past or today
- rating: from 1 to 5 included
- genre: enum
- actors name: array of strings
- poster: image url
- created by: the user who created the movie

### 3. Access restrictions
- Anyone can access the list of movies
- Anyone can access the list of movie of a specific user
- Only registered users can create a movie
- Only the author can update or delete a movie
- Admins can update or delete any movie

### 4. End to end tests
- Auth
  - Can register using an e-mail and a compliant password
  - Can't register using the same e-mail as someone else
  - Can't register using an e-mail and password that doesn't match the validator
  - Can login using the right e-mail and right password
  - Can't login using the right e-mail and wrong password
  - Can't login using the wrong e-mail and right password

- Movies
  - Can retrieve the movie list when not logged in
  - Can retrieve the movie list when logged in with a user role
  - Can retrieve the movie list when logged in with an admin role
  - Can retrieve the movie list of a specific user when not logged in
  - Can't create a movie when not logged in
  - Can create a movie when logged in with a user role
  - Can create a movie when logged in with an admin role
  - Creating a movie should pass the field validators (title, description, etc...)
  - Can update user's own movie
  - Updating a movie should pass the field validators (title, description, etc...)
  - Can't update another user's movie when not admin
  - Can update another user's movie when admin
  - Can delete user's own movie
  - Can't delete another user's movie when not admin
  - Can delete another user's movie when admin

### ✅ Conditions
- Use MongoDB with Mongoose
- Unit tests for each service
- End to end test using in memory database (mongodb-memory-server)
- API documentation with Swagger
- DTO + validation
- Error handling
- Every variable must be typed using Typescript
- **⚠️ Your code should demonstrate:**
  - Single Source of Truth principle
  - DRY principle
  - KISS principle
  - SOLID principle
- **⚠️ We will carefully assess how you structured your code and the project, imagine you're working within a team. Demonstrate how rigorous you are.**

**Good luck!** 💪
