const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
  server: "localhost",
  database: "MyCalendar",
  user: "calendarApp",
  password: "CyC@lend@r2018!",
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  port: 1433
};

sql.connect(dbConfig)
  .then(() => {
    console.log("Connected to SQL Server");
  })
  .catch(err => {
    console.error("Database connection failed:", err);
  });

app.get("/", (req, res) => {
  res.send("Calendar backend is running");
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await sql.query`
      SELECT * FROM Users WHERE email = ${email}
    `;

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sql.query`
      INSERT INTO Users (email, password_hash)
      OUTPUT INSERTED.id, INSERTED.email
      VALUES (${email}, ${hashedPassword})
    `;

    res.json({
      message: "User created successfully",
      userId: result.recordset[0].id,
      email: result.recordset[0].email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await sql.query`
      SELECT * FROM Users WHERE email = ${email}
    `;

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.recordset[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      userId: user.id,
      email: user.email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

app.post("/events", async (req, res) => {
  const { userId, title, eventDate, timeRange, repeatRule, untilDate, excludeRule, flexible, color } = req.body;

  try {
    const result = await sql.query`
      INSERT INTO Events (user_id, title, event_date, time_range, repeat_rule, until_date, exclude_rule, flexible, color)
      OUTPUT INSERTED.id
      VALUES (${userId}, ${title}, ${eventDate}, ${timeRange}, ${repeatRule}, ${untilDate || null}, ${excludeRule || null}, ${flexible ? 1 : 0},${color || "#f7d7ec"})
    `;

    res.json({
      message: "Event saved successfully",
      eventId: result.recordset[0].id
    });
  } catch (err) {
    console.error("SAVE EVENT ERROR:", err);
    res.status(500).json({ message: "Failed to save event" });
  }
});

app.get("/events/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await sql.query`
      SELECT * FROM Events WHERE user_id = ${userId}
    `;

    res.json(result.recordset);
  } catch (err) {
    console.error("LOAD EVENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load events" });
  }
});

app.delete("/events/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId;

  try {
    await sql.query`
      DELETE FROM Events
      WHERE id = ${id} AND user_id = ${userId}
    `;

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("DELETE EVENT ERROR:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

app.put("/events/:id", async (req, res) => {
  const { id } = req.params;
  const {
    userId,
    title,
    eventDate,
    timeRange,
    repeatRule,
    untilDate,
    excludeRule,
    flexible,
    color
  } = req.body;

  try {
    const result = await sql.query`
      UPDATE Events
      SET
        title = ${title},
        event_date = ${eventDate},
        time_range = ${timeRange || ""},
        repeat_rule = ${repeatRule || ""},
        until_date = ${untilDate || null},
        exclude_rule = ${excludeRule || ""},
        flexible = ${flexible ? 1 : 0},
        color = ${color || "#f7d7ec"}
      WHERE id = ${id} AND user_id = ${userId}
    `;

    res.json({ message: "Event updated successfully" });
  } catch (err) {
    console.error("UPDATE EVENT ERROR:", err);
    res.status(500).json({ message: "Failed to update event" });
  }
});