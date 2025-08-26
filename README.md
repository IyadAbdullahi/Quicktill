# School Payment Management System

![School Payment System](screenshots/quicktill_pos.png)

Desktop School Payment Management System built with Electron

**Features:**

- Multi-PC network support with centralized database
- Receipt Printing.
- Student database management
- Payment category management (compulsory/optional)
- Student payment recording and tracking
- Outstanding balance monitoring
- Staff accounts and permissions.
- Comprehensive reporting system
- Search functionality for students and payments
- Date range filtering for transactions
- Export capabilities (Excel, PDF, Print)
- Student ID barcode generation

## Development

The School Payment Management System is an offline-first application built on jQuery, Node.js, and Electron. It utilizes local NeDB databases by default.

### Database Schema

The system uses the following main databases:
- `students.db` - Student information and enrollment data
- `payment_categories.db` - Payment types (compulsory/optional)
- `student_payments.db` - Payment records and transactions
- `users.db` - Staff accounts and permissions (existing)
- `settings.db` - School configuration settings (existing)

### Pre-requisites

To get the dev environment up and running you need to first set up Node.js version
16.14.0 or greater and npm. For this, we suggest using
[nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

Next, you will need to install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable).

### Clone and Run

Once you are through the Pre-requisites, you can run the following commands to
setup Quicktill for development and building:

```bash
# clone the repository
git clone https://github.com/Ayuen-madyt/School-Payment-System.git

# change directory
cd School-Payment-System

# install dependencies
yarn
```

#### Development

To run the School Payment System in development mode:

```bash
# start the electron app
yarn electron
```

#### Build

To build the School Payment System and create an installer:

```bash
# start the electron app
yarn electron-build
```

**Note: Build Target**
By default the above command will build for your computer's operating system and
architecture. To build for other environments (example: for linux from a windows
computer) check the _Building_ section at
[electron.build/cli](https://www.electron.build/cli).

### Project Contribution Guidelines

Thank you for your interest in contributing to the School Payment Management System! This document outlines the guidelines for contributing to our repository. Please take a moment to read through this guide before making any contributions. By following these guidelines, you will help us maintain a high-quality codebase and ensure a smooth contribution process.

### Branching

- Create a new branch for each significant contribution or bug fix.
- Choose a descriptive name for your branch that reflects the purpose of your changes.-
- To create a new branch: git checkout -b branch-name.

### Development Workflow

- Fork the repository first.
- Familiarize yourself with the project's technology stack, including jQuery, Node, and Electron.
- Make your code changes, following the existing coding style and conventions.
- Test your changes thoroughly, ensuring they work seamlessly with the system's offline functionality.
- Commit your changes with a clear and descriptive commit message.
- Push your changes to your forked repository.
- Open a pull request (PR) from your branch to the master branch of the main repository.

### Pull Request Guidelines

- Each PR should have a clear and descriptive title.
- Include a concise summary of the changes made in the description.
- Provide any relevant information or context that may help reviewers understand the purpose and impact of the changes.


## License

[GNU Affero General Public License v3.0](LICENSE)
