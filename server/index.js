const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


// ==========================================
// DATABASE SETUP
// ==========================================

async function setupDatabase() {

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS project_users (
            project_id INT REFERENCES projects(id) ON DELETE CASCADE,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (project_id, user_id)
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,

            project_id INT
                REFERENCES projects(id)
                ON DELETE CASCADE,

            assigned_to INT
                REFERENCES users(id),

            title VARCHAR(200) NOT NULL,

            description TEXT,

            priority VARCHAR(20)
                DEFAULT 'Medium',

            due_date DATE,

            status VARCHAR(20)
                DEFAULT 'todo'
        );
    `);

    // Create default project
    const projectResult = await pool.query(
        "SELECT * FROM projects LIMIT 1"
    );

    if (projectResult.rows.length === 0) {
        await pool.query(
            "INSERT INTO projects (name) VALUES ($1)",
            ["Task Management Project"]
        );
    }

    // Create default users
    const userResult = await pool.query(
        "SELECT * FROM users LIMIT 1"
    );

    if (userResult.rows.length === 0) {
        await pool.query(`
            INSERT INTO users (name)
            VALUES
                ('Likhita'),
                ('Rahul'),
                ('Ananya'),
                ('Arjun')
        `);
    }

    console.log("Database setup completed!");
}


// ==========================================
// GET ALL TASKS
// ==========================================

app.get("/api/tasks", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                t.id,
                t.title,
                t.description,
                t.priority,
                t.due_date,
                t.status,
                t.assigned_to,
                u.name AS assigned_user
            FROM tasks t
            LEFT JOIN users u
                ON t.assigned_to = u.id
            ORDER BY t.id DESC
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch tasks"
        });
    }
});


// ==========================================
// GET SINGLE TASK
// ==========================================

app.get("/api/tasks/:id", async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM tasks
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Task not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch task"
        });
    }
});


// ==========================================
// CREATE TASK
// ==========================================

app.post("/api/tasks", async (req, res) => {

    try {

        const {
            title,
            description,
            priority,
            due_date,
            assigned_to
        } = req.body;

        if (!title || !title.trim()) {

            return res.status(400).json({
                error: "Title is required"
            });
        }

        const validPriorities = [
            "High",
            "Medium",
            "Low"
        ];

        if (!validPriorities.includes(priority)) {

            return res.status(400).json({
                error: "Invalid priority"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO tasks
            (
                project_id,
                assigned_to,
                title,
                description,
                priority,
                due_date,
                status
            )
            VALUES
            (
                1,
                $1,
                $2,
                $3,
                $4,
                $5,
                'todo'
            )
            RETURNING *
            `,
            [
                assigned_to || null,
                title.trim(),
                description || "",
                priority,
                due_date || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to create task"
        });
    }
});


// ==========================================
// FULL UPDATE TASK
// ==========================================

app.put("/api/tasks/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            title,
            description,
            priority,
            due_date,
            assigned_to,
            status
        } = req.body;

        const validStatuses = [
            "todo",
            "in_progress",
            "done"
        ];

        const validPriorities = [
            "High",
            "Medium",
            "Low"
        ];

        if (!title || !title.trim()) {

            return res.status(400).json({
                error: "Title is required"
            });
        }

        if (!validStatuses.includes(status)) {

            return res.status(400).json({
                error: "Invalid status"
            });
        }

        if (!validPriorities.includes(priority)) {

            return res.status(400).json({
                error: "Invalid priority"
            });
        }

        const result = await pool.query(
            `
            UPDATE tasks

            SET
                title = $1,
                description = $2,
                priority = $3,
                due_date = $4,
                assigned_to = $5,
                status = $6

            WHERE id = $7

            RETURNING *
            `,
            [
                title.trim(),
                description || "",
                priority,
                due_date || null,
                assigned_to || null,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Task not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to update task"
        });
    }
});


// ==========================================
// DELETE TASK
// ==========================================

app.delete("/api/tasks/:id", async (req, res) => {

    try {

        const result = await pool.query(
            `
            DELETE FROM tasks
            WHERE id = $1
            RETURNING id
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Task not found"
            });
        }

        res.json({
            message: "Task deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to delete task"
        });
    }
});


// ==========================================
// GET USERS + WORKLOAD
// ==========================================

app.get("/api/users", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                u.id,
                u.name,

                COUNT(
                    CASE
                        WHEN t.status = 'in_progress'
                        THEN 1
                    END
                ) AS in_progress_count

            FROM users u

            LEFT JOIN tasks t
                ON u.id = t.assigned_to

            GROUP BY
                u.id,
                u.name

            ORDER BY u.id
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch users"
        });
    }
});


// ==========================================
// CREATE USER
// ==========================================

app.post("/api/users", async (req, res) => {

    try {

        const { name } = req.body;

        if (!name || !name.trim()) {

            return res.status(400).json({
                error: "Name is required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO users (name)
            VALUES ($1)
            RETURNING *
            `,
            [name.trim()]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to create user"
        });
    }
});


// ==========================================
// GET PROJECT USERS
// ==========================================

app.get(
    "/api/projects/:projectId/users",
    async (req, res) => {

        try {

            const result = await pool.query(
                `
                SELECT
                    u.id,
                    u.name
                FROM users u

                JOIN project_users pu
                    ON u.id = pu.user_id

                WHERE pu.project_id = $1

                ORDER BY u.id
                `,
                [req.params.projectId]
            );

            res.json(result.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Failed to fetch project users"
            });
        }
    }
);


// ==========================================
// ADD USER TO PROJECT
// ==========================================

app.post(
    "/api/projects/:projectId/users",
    async (req, res) => {

        try {

            const {
                user_id
            } = req.body;

            if (!user_id) {

                return res.status(400).json({
                    error: "User is required"
                });
            }

            await pool.query(
                `
                INSERT INTO project_users
                (
                    project_id,
                    user_id
                )

                VALUES
                (
                    $1,
                    $2
                )

                ON CONFLICT DO NOTHING
                `,
                [
                    req.params.projectId,
                    user_id
                ]
            );

            res.status(201).json({
                message: "User added to project"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Failed to add user to project"
            });
        }
    }
);


// ==========================================
// REMOVE USER FROM PROJECT
// ==========================================

app.delete(
    "/api/projects/:projectId/users/:userId",
    async (req, res) => {

        try {

            await pool.query(
                `
                DELETE FROM project_users

                WHERE project_id = $1
                AND user_id = $2
                `,
                [
                    req.params.projectId,
                    req.params.userId
                ]
            );

            res.json({
                message: "User removed from project"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Failed to remove user"
            });
        }
    }
);


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {

    res.send(
        "Task Management API is running!"
    );

});


// ==========================================
// START SERVER
// ==========================================

async function startServer() {

    try {

        await setupDatabase();

        app.listen(PORT, () => {

            console.log(
                `Server running on http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "Could not start server:",
            error
        );
    }
}

startServer();