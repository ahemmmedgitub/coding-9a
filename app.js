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
      response.status(401);
      response.send("User already exist");
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
      userDetails.password,
      password
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
  const getUserDetails = `
        SELECT 
            * 
        FROM 
            user
        WHERE 
            username = '${username}';
    `;
  const userDetails = await db.get(getUserDetails);

  const comPassword = bcrypt.compare(oldPassword, userDetails.password);

  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (comPassword === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      response.status(200);
      response.send("Successful password update");
    }
  }
});

module.exports = app;
