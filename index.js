import pg from 'pg';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file


const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    database: process.env.DB_NAME,
    port: 5432,
});

const connectToDb = async () => {
    try {
      await pool.connect();
      console.log('Connected to the database.');
    } catch (err) {
      console.error('Error connecting to database:', err);
      process.exit(1);
    }
};

await connectToDb();



const mainMenu = async () => {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            'View All Employees',
            'Add Employee',
            'Update Employee Role',
            'View All Roles',
            'Add Role',
            'View All Departments',
            'Add Department',
            'Exit',
            ],
      },
    ]);

    if (action === 'View All Employees') {
        await viewAllEmployees();
    } else if (action === 'Add Employee') {
      await addEmployee();
    } else if (action === 'Update Employee Role') {
      await updateEmployeeRole();
    } else if (action === 'View All Roles') {
        await viewAllRoles();
    } else if (action === 'Add Role') {
        await addRole();
    } else if (action === 'View All Departments') {
        await viewAllDepartments();
    } else if (action === 'Add Department') {
        await addDepartment();
    } else {
      process.exit();
    }
    await mainMenu();
};

mainMenu();

const viewAllEmployees = async () => { 
    const result = await pool.query(`
        SELECT 
            employee.first_name, 
            employee.last_name, 
            role.title AS role_title,       
            department.name AS department_name,
            role.salary AS role_salary,
            manager.first_name AS manager_first_name,
            manager.last_name AS manager_last_name 
        FROM employee
        JOIN role ON employee.role_id = role.id
        JOIN department ON role.department_id = department.id
        LEFT JOIN employee AS manager ON employee.manager_id = manager.id
    `);
    console.table(result.rows);
};


const addEmployee = async () => { 

    const roles = await pool.query('SELECT * FROM role');
    const managers = await pool.query('SELECT * FROM employee');
    
    await inquirer.prompt([
        { type: 'input', name: 'firstName', message: 'Enter the first name:' },
        { type: 'input', name: 'lastName', message: 'Enter the last name:' },
        { type: 'list',
            name: 'role',
            message: 'Select the role:',
            choices: roles.rows.map((role) => ({ 
                name: role.title, 
                value: role.id }))
        },
        { type: 'list',
            name: 'manager',
            message: 'Who is the employees manager?',
            choices: managers.rows.map((managers) => ({ 
                name: `${managers.first_name} ${managers.last_name}`, 
                value: managers.id }))
        },
    ]).then(async (answers) => {
        await pool.query(
            'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
            [answers.firstName, answers.lastName, answers.role, answers.manager]
        );
        console.log('Employee added successfully');
    });
};

const updateEmployeeRole = async () => { 
    const employees = await pool.query('SELECT * FROM employee');
    const roles = await pool.query('SELECT * FROM role');

    await inquirer.prompt([
        { type: 'list',
            name: 'employeeId',
            message: 'Which employees role do you want to update?',
            choices: employees.rows.map((employees) => ({name: `${employees.first_name} ${employees.last_name}`, value: employees.id}))
        },
        { type: 'list',
            name: 'role',
            message: 'Which role do you want to assign the selected employee?',
            choices: roles.rows.map((roles) => ({ 
            name: `${roles.title}`, 
            value: roles.id }))
        },
    ]).then(async (answers) => {
        await pool.query(
            'UPDATE employee SET role_id = $1 WHERE id = $2',
            [answers.role, answers.employeeId]
        );
        console.log('Employee role updated successfully');
    });
};

const viewAllRoles = async () => {
    const result = await pool.query('SELECT * FROM role');
    console.table(result.rows);
};

const addRole = async () => { 
    const department = await pool.query('SELECT * FROM department');

    await inquirer.prompt([
        { type: 'input', name: 'title', message: 'Enter the title:' },
        { type: 'input', name: 'salary', message: 'Enter the salary:' },
        {
            type: 'list',
            name: 'department',
            message: 'Select the department:',
            choices: department.rows.map((department) => ({ name: department.name, value: department.id }))
        }
    ]).then(async (answers) => {
        await pool.query(
            'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
            [answers.title, answers.salary, answers.department]
        );
        console.log('Role added successfully');
    });
};

const viewAllDepartments = async () => {
    const result = await pool.query('SELECT * FROM department');
    console.table(result.rows);
};

const addDepartment = async () => { 
    await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Enter the name:' },
    ]).then(async (answers) => {
        await pool.query(
            'INSERT INTO department (name) VALUES ($1)',
            [answers.name]
        );
        console.log('Department added successfully');
    });
};
