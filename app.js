const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

//LOG IN USER
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const passwordLength = password.length;
  if (passwordLength < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const userDetails = `
    SELECT 
        *
    FROM 
        user
    WHERE 
        username = '${username}'; 
  `;
    const userResponse = await db.get(userDetails);

    if (userResponse === undefined) {
      const creatNewUser = `
        INSERT INTO 
            user(username, name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );
      `;
      await db.run(creatNewUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

// POST Method
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserName = `
        SELECT 
            *
        FROM 
            user
        WHERE 
            username = '${username}';
    `;
  const userDetails = await db.get(getUserName);

  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparedPassword = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (comparedPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3 PUT Method
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await db.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
