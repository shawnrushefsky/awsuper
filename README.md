# AWSuper

A containerized Webserver and accompanying Command Line tool for easily performing and automating long-running tasks in AWS, such as rolling green/blue updates, EBS snapshots, etc.

### Goals

1. Webserver should be natively deployable through docker
2. Webserver should have minimal system requirements
3. Webserver should follow security best practices, and protect aws credentials
4. Command line tool should feature tab autocompletion
5. Command line tool should be maximally expressive
6. Command line tool should be installable through common package managers

There is documentation for the server in the `server` directory, and documentation for the CLI in the `command-line-tool` directory.