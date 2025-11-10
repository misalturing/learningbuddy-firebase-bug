This project is an automated evaluation harness for a Gemini agent.

### Task

The user wants to modify a React application with the following requests:
1.  The user dashboard, which currently shows the user's email, should be updated to display the name provided during onboarding.
2.  A bug needs to be fixed where the name entered during the onboarding quiz is not being correctly saved to the database.
3.  The onboarding quiz should be updated to include a new field asking for the user's next exam date in `dd/mm/yy` format.

### Automated Evaluation Flow

This harness automates the process of running a Gemini agent to solve the user's task and verifies the solution.

1.  **Environment Setup:** The `Dockerfile` sets up a Node.js environment, installs project dependencies, and copies the initial project files.
2.  **Agent Execution:** The `run_gemini.sh` script is executed, which runs the Gemini CLI with the user's prompt (`prompt.txt`). The agent then attempts to modify the code to address the user's requests.
3.  **Verification:** After the agent has finished, the `verify.sh` script is executed. This script checks that:
    *   The code was modified to correctly pass and save the user's name.
    *   The onboarding form was updated to include the exam date field.
    *   The project still builds successfully after the agent's modifications.

### How to Run

1.  **Set the Gemini API Key:**

    ```sh
    export GEMINI_API_KEY="your_api_key_here"
    ```

2.  **Build and Run the Evaluation:**

    ```sh
    docker-compose up --build
    ```

### Expected Output

A successful run will complete with an exit code of 0, and the output will include:

```
--- Verification Summary ---
✅ Verification successful!
```

If the agent fails to implement the feature correctly or breaks the build, the `verify.sh` script will report the failure and the container will exit with a non-zero status code.