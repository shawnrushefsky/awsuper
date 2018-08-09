# AWSuper

A containerized Webserver and accompanying Command Line tool for easily performing and automating long-running tasks in AWS, such as rolling green/blue updates, EBS snapshots, etc.

### Goals

- [x] Webserver should be natively deployable through docker
- [x] Webserver should have minimal system requirements
- [x] Webserver should follow security best practices, and protect aws credentials
- [ ] Command line tool should feature tab autocompletion
- [x] Command line tool should be maximally expressive
- [x] Command line tool should be installable through common package managers

There is documentation for the server in the `server` directory, and documentation for the CLI in the `command-line-tool` directory.