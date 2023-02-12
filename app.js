const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;
const bcrypt = require("bcrypt");

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

intializeDBAndServer();

//API 1

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const getUserQuery = `
  SELECT 
  *
  FROM 
  user
  WHERE username = "${username}";
  `;
  const getUserResult = await db.get(getUserQuery);

  if (getUserResult === undefined) {
    //create new user code
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createNewUserQuery = `
        INSERT INTO
        user (username, name, password, gender, location)
        VALUES ("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}");
        `;
      await db.run(createNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    //user already exists
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
  SELECT 
  *
  FROM 
  user
  WHERE username = "${username}";
  `;
  const getUserResult = await db.get(getUserQuery);
  //console.log(getUserResult);

  if (getUserResult === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      getUserResult.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const getUserQuery = `
  SELECT 
  *
  FROM 
  user
  WHERE username = "${username}";
  `;
  const getUserResult = await db.get(getUserQuery);
  const isPasswordValid = await bcrypt.compare(
    oldPassword,
    getUserResult.password
  );
  if (isPasswordValid === true) {
    //new password
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const encryptedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
        UPDATE 
        user
        SET
        (password = "${encryptedPassword}")
        WHERE
        username = "${username}";
        `;
      await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
