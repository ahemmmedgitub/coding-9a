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
            '${password}',
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
});
