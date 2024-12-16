## Goal

Write tests once, ensure don't ship broken release or let broken commits into master.
Additional manual testing by devs, beta testers are now hassle-free. (see e.g. [issue 8](https://github.com/SIMKL/Sync-Simkl-to-Plex-Chrome-Extension/issues/8) and [issue 10](https://github.com/SIMKL/Sync-Simkl-to-Plex-Chrome-Extension/issues/10))

### e2e

- To test the extension works with real accounts (before releasing it)
  - these take time so not per commit tests.
- will test ui as well with same test accounts, but now sync included

### ux

- per commit tests should run only ui tests.
- ui/ux tests are playwright tests
- ui tests won't test sync functionality just capture ui flows
- ui tests will use the same real test accounts
- offline tests

## TODO

Sorted by priority

- [x] test simkl acc
- [x] test plex acc
- [ ] teardown plex library
- [ ] teardown simkl library

- [ ] mock plex library buildup based on a real simkl library
- [ ] mock simkl library based on a random real public user.
  - i.e. pick a real user with lots of entries at random (with limits?)
  - and create a simkl library and plex library for the test account.
- [ ] docker setup for plex
- [ ] local plex setup (linux, windows, macos)

- [ ] the tests
  - ui
  - e2e
  - all platforms

Low priority

- [ ] nixosTest (own nur)
  - will test on a nixos machine
- [ ] numtide/nix-vm-test (own nur)
  - will test on ubuntu machine
