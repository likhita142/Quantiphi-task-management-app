import { useEffect, useState } from "react";
import "./App.css";

type Task = {
    id: number;
    title: string;
    description: string;
    priority: string;
    due_date: string | null;
    status: string;
    assigned_to: number | null;
    assigned_user: string | null;
};

type User = {
    id: number;
    name: string;
    in_progress_count: number;
};

function App() {

    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projectUsers, setProjectUsers] = useState<User[]>([]);

    const [filter, setFilter] = useState("All");

    const [draggedTask, setDraggedTask] =
        useState<Task | null>(null);

    const [showTaskForm, setShowTaskForm] =
        useState(false);

    const [showUserForm, setShowUserForm] =
        useState(false);

    const [showProjectUserForm, setShowProjectUserForm] =
        useState(false);

    const [editingTask, setEditingTask] =
        useState<Task | null>(null);

    const [userName, setUserName] = useState("");

    const [projectUserId, setProjectUserId] =
        useState("");

    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        priority: "Medium",
        due_date: "",
        assigned_to: ""
    });


    // ==========================================
    // FETCH TASKS
    // ==========================================

    const fetchTasks = async () => {

        try {

            const response =
                await fetch("/api/tasks");

            const data = await response.json();

            setTasks(data);

        } catch (error) {

            console.error(
                "Failed to fetch tasks:",
                error
            );
        }
    };


    // ==========================================
    // FETCH USERS
    // ==========================================

    const fetchUsers = async () => {

        try {

            const response =
                await fetch("/api/users");

            const data = await response.json();

            setUsers(data);

        } catch (error) {

            console.error(
                "Failed to fetch users:",
                error
            );
        }
    };


    // ==========================================
    // FETCH PROJECT USERS
    // ==========================================

    const fetchProjectUsers = async () => {

        try {

            const response =
                await fetch(
                    "/api/projects/1/users"
                );

            const data = await response.json();

            setProjectUsers(data);

        } catch (error) {

            console.error(
                "Failed to fetch project users:",
                error
            );
        }
    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        fetchTasks();
        fetchUsers();
        fetchProjectUsers();

    }, []);


    // ==========================================
    // CREATE / UPDATE TASK
    // ==========================================

    const saveTask = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        try {

            if (editingTask) {

                await fetch(
                    `/api/tasks/${editingTask.id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            ...taskForm,
                            assigned_to:
                                taskForm.assigned_to
                                    ? Number(
                                        taskForm.assigned_to
                                    )
                                    : null,
                            status:
                                editingTask.status
                        })
                    }
                );

            } else {

                await fetch(
                    "/api/tasks",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            ...taskForm,
                            assigned_to:
                                taskForm.assigned_to
                                    ? Number(
                                        taskForm.assigned_to
                                    )
                                    : null
                        })
                    }
                );
            }


            setTaskForm({
                title: "",
                description: "",
                priority: "Medium",
                due_date: "",
                assigned_to: ""
            });

            setEditingTask(null);

            setShowTaskForm(false);

            fetchTasks();
            fetchUsers();

        } catch (error) {

            console.error(
                "Failed to save task:",
                error
            );
        }
    };


    // ==========================================
    // OPEN EDIT FORM
    // ==========================================

    const editTask = (task: Task) => {

        setEditingTask(task);

        setTaskForm({
            title: task.title,
            description: task.description || "",
            priority: task.priority,
            due_date: task.due_date || "",
            assigned_to:
                task.assigned_to
                    ? String(task.assigned_to)
                    : ""
        });

        setShowTaskForm(true);
    };


    // ==========================================
    // CREATE USER
    // ==========================================

    const createUser = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        try {

            await fetch(
                "/api/users",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        name: userName
                    })
                }
            );

            setUserName("");

            setShowUserForm(false);

            fetchUsers();

        } catch (error) {

            console.error(
                "Failed to create user:",
                error
            );
        }
    };


    // ==========================================
    // ADD USER TO PROJECT
    // ==========================================

    const addUserToProject = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!projectUserId) return;

        try {

            await fetch(
                "/api/projects/1/users",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        user_id:
                            Number(projectUserId)
                    })
                }
            );

            setProjectUserId("");

            setShowProjectUserForm(false);

            fetchProjectUsers();

        } catch (error) {

            console.error(
                "Failed to add user:",
                error
            );
        }
    };


    // ==========================================
    // REMOVE USER FROM PROJECT
    // ==========================================

    const removeUserFromProject = async (
        userId: number
    ) => {

        try {

            await fetch(
                `/api/projects/1/users/${userId}`,
                {
                    method: "DELETE"
                }
            );

            fetchProjectUsers();

        } catch (error) {

            console.error(
                "Failed to remove user:",
                error
            );
        }
    };


    // ==========================================
    // MOVE TASK
    // ==========================================

    const moveTask = async (
        status: string
    ) => {

        if (!draggedTask) return;

        try {

            await fetch(
                `/api/tasks/${draggedTask.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        title:
                            draggedTask.title,
                        description:
                            draggedTask.description,
                        priority:
                            draggedTask.priority,
                        due_date:
                            draggedTask.due_date,
                        assigned_to:
                            draggedTask.assigned_to,
                        status
                    })
                }
            );

            setDraggedTask(null);

            fetchTasks();
            fetchUsers();

        } catch (error) {

            console.error(
                "Failed to move task:",
                error
            );
        }
    };


    // ==========================================
    // DELETE TASK
    // ==========================================

    const deleteTask = async (
        id: number
    ) => {

        try {

            await fetch(
                `/api/tasks/${id}`,
                {
                    method: "DELETE"
                }
            );

            fetchTasks();
            fetchUsers();

        } catch (error) {

            console.error(
                "Failed to delete task:",
                error
            );
        }
    };


    // ==========================================
    // FILTER
    // ==========================================

    const filteredTasks =
        tasks.filter(
            task =>
                filter === "All" ||
                task.priority === filter
        );


    // ==========================================
    // KANBAN COLUMN
    // ==========================================

    const Column = ({
        title,
        status
    }: {
        title: string;
        status: string;
    }) => {

        const columnTasks =
            filteredTasks.filter(
                task =>
                    task.status === status
            );

        return (

            <section
                className="column"
                onDragOver={
                    e => e.preventDefault()
                }
                onDrop={() =>
                    moveTask(status)
                }
            >

                <div className="column-title">

                    <h2>{title}</h2>

                    <span>
                        {columnTasks.length}
                    </span>

                </div>


                {columnTasks.map(task => (

                    <div
                        className="task-card"
                        key={task.id}
                        draggable
                        onDragStart={() =>
                            setDraggedTask(task)
                        }
                    >

                        <div className="task-heading">

                            <h3>
                                {task.title}
                            </h3>

                            <span
                                className={`priority ${task.priority.toLowerCase()}`}
                            >
                                {task.priority}
                            </span>

                        </div>


                        <p>
                            {task.description}
                        </p>


                        <div className="task-info">

                            <span>
                                📅{" "}
                                {task.due_date ||
                                    "No due date"}
                            </span>

                            <span>
                                👤{" "}
                                {task.assigned_user ||
                                    "Unassigned"}
                            </span>

                        </div>


                        <div
                            className="task-actions"
                        >

                            <button
                                className="edit"
                                onClick={() =>
                                    editTask(task)
                                }
                            >
                                Edit
                            </button>


                            <button
                                className="delete"
                                onClick={() =>
                                    deleteTask(
                                        task.id
                                    )
                                }
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                ))}

            </section>

        );
    };


    // ==========================================
    // RETURN UI
    // ==========================================

    return (

        <div className="app">


            {/* HEADER */}

            <header>

                <div>

                    <h1>
                        TaskFlow
                    </h1>

                    <p>
                        Team Task Management
                    </p>

                </div>


                <div className="actions">

                    <button
                        onClick={() => {

                            setEditingTask(null);

                            setTaskForm({
                                title: "",
                                description: "",
                                priority: "Medium",
                                due_date: "",
                                assigned_to: ""
                            });

                            setShowTaskForm(true);

                        }}
                    >
                        + Create Task
                    </button>


                    <button
                        onClick={() =>
                            setShowUserForm(true)
                        }
                    >
                        + Add User
                    </button>


                    <button
                        onClick={() =>
                            setShowProjectUserForm(
                                true
                            )
                        }
                    >
                        + Add to Project
                    </button>


                    <select
                        value={filter}
                        onChange={
                            e =>
                                setFilter(
                                    e.target.value
                                )
                        }
                    >

                        <option>
                            All
                        </option>

                        <option>
                            High
                        </option>

                        <option>
                            Medium
                        </option>

                        <option>
                            Low
                        </option>

                    </select>

                </div>

            </header>


            {/* PROJECT MEMBERS */}

            <section className="team">

                <h2>
                    Project Members
                </h2>


                <div className="team-list">

                    {projectUsers.length === 0 ? (

                        <p>
                            No users added to this
                            project yet.
                        </p>

                    ) : (

                        projectUsers.map(user => (

                            <div
                                className="member"
                                key={user.id}
                            >

                                <div className="avatar">

                                    {user.name[0]}

                                </div>


                                <div>

                                    <strong>
                                        {user.name}
                                    </strong>

                                    <small>
                                        Project member
                                    </small>

                                </div>


                                <button
                                    className="delete"
                                    onClick={() =>
                                        removeUserFromProject(
                                            user.id
                                        )
                                    }
                                >
                                    Remove
                                </button>

                            </div>

                        ))

                    )}

                </div>

            </section>


            {/* TEAM WORKLOAD */}

            <section className="team">

                <h2>
                    Team Workload
                </h2>


                <div className="team-list">

                    {users.map(user => (

                        <div
                            className="member"
                            key={user.id}
                        >

                            <div
                                className={
                                    user.in_progress_count > 5
                                        ? "avatar overloaded"
                                        : "avatar"
                                }
                            >

                                {user.name[0]}

                            </div>


                            <div>

                                <strong>
                                    {user.name}
                                </strong>

                                <small>

                                    {
                                        user.in_progress_count
                                    }

                                    {" "}in progress

                                </small>

                            </div>

                        </div>

                    ))}

                </div>

            </section>


            {/* KANBAN */}

            <main className="board">

                <Column
                    title="To-Do"
                    status="todo"
                />

                <Column
                    title="In Progress"
                    status="in_progress"
                />

                <Column
                    title="Done"
                    status="done"
                />

            </main>


            {/* TASK FORM */}

            {showTaskForm && (

                <div className="modal-bg">

                    <form
                        className="modal"
                        onSubmit={saveTask}
                    >

                        <h2>

                            {editingTask
                                ? "Edit Task"
                                : "Create Task"}

                        </h2>


                        <input
                            placeholder="Task title"
                            value={
                                taskForm.title
                            }
                            onChange={e =>
                                setTaskForm({
                                    ...taskForm,
                                    title:
                                        e.target.value
                                })
                            }
                            required
                        />


                        <textarea
                            placeholder="Description"
                            value={
                                taskForm.description
                            }
                            onChange={e =>
                                setTaskForm({
                                    ...taskForm,
                                    description:
                                        e.target.value
                                })
                            }
                        />


                        <select
                            value={
                                taskForm.priority
                            }
                            onChange={e =>
                                setTaskForm({
                                    ...taskForm,
                                    priority:
                                        e.target.value
                                })
                            }
                        >

                            <option>
                                High
                            </option>

                            <option>
                                Medium
                            </option>

                            <option>
                                Low
                            </option>

                        </select>


                        <input
                            type="date"
                            value={
                                taskForm.due_date
                            }
                            onChange={e =>
                                setTaskForm({
                                    ...taskForm,
                                    due_date:
                                        e.target.value
                                })
                            }
                        />


                        <select
                            value={
                                taskForm.assigned_to
                            }
                            onChange={e =>
                                setTaskForm({
                                    ...taskForm,
                                    assigned_to:
                                        e.target.value
                                })
                            }
                        >

                            <option value="">
                                Unassigned
                            </option>


                            {users.map(user => (

                                <option
                                    key={user.id}
                                    value={user.id}
                                >
                                    {user.name}
                                </option>

                            ))}

                        </select>


                        <div
                            className="modal-buttons"
                        >

                            <button
                                type="submit"
                            >
                                {editingTask
                                    ? "Save Changes"
                                    : "Create"}
                            </button>


                            <button
                                type="button"
                                onClick={() => {

                                    setShowTaskForm(
                                        false
                                    );

                                    setEditingTask(
                                        null
                                    );

                                }}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* ADD USER */}

            {showUserForm && (

                <div className="modal-bg">

                    <form
                        className="modal"
                        onSubmit={createUser}
                    >

                        <h2>
                            Add User
                        </h2>


                        <input
                            placeholder="User name"
                            value={userName}
                            onChange={e =>
                                setUserName(
                                    e.target.value
                                )
                            }
                            required
                        />


                        <div
                            className="modal-buttons"
                        >

                            <button
                                type="submit"
                            >
                                Add User
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowUserForm(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* ADD USER TO PROJECT */}

            {showProjectUserForm && (

                <div className="modal-bg">

                    <form
                        className="modal"
                        onSubmit={
                            addUserToProject
                        }
                    >

                        <h2>
                            Add User to Project
                        </h2>


                        <p>
                            Select an existing user
                            to add to this project.
                        </p>


                        <select
                            value={
                                projectUserId
                            }
                            onChange={e =>
                                setProjectUserId(
                                    e.target.value
                                )
                            }
                            required
                        >

                            <option value="">
                                Select User
                            </option>


                            {users
                                .filter(
                                    user =>
                                        !projectUsers.some(
                                            projectUser =>
                                                projectUser.id ===
                                                user.id
                                        )
                                )
                                .map(user => (

                                    <option
                                        key={user.id}
                                        value={user.id}
                                    >
                                        {user.name}
                                    </option>

                                ))}

                        </select>


                        <div
                            className="modal-buttons"
                        >

                            <button
                                type="submit"
                            >
                                Add to Project
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowProjectUserForm(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>

            )}

        </div>

    );
}

export default App;