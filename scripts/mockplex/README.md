## Plex Mock Data

A plex mock library generator for testing the extension.

### TODO

- [ ] Generate movie, shows directory structures
  - [ ] by IDS
    - tvdb/tvdbslug
    - imdb/tmdb
    - anidb
    - simkl
  - [ ] get a random valid id

### Setup

Install [go](https://go.dev/doc/install)

```sh
# on windows
# install scoop in powershell
iwr -useb get.scoop.sh | iex
Set-ExecutionPolicy RemoteSigned -scope CurrentUser
scoop install go
```

### Run

```sh
cd scripts/plexMock
# unix
go build && ./mockplex
# windows
# go build && .\mockplex.exe
```

### Details

- got a tiny webm video 185 bytes from https://github.com/mathiasbynens/small/issues/10
  - which was created using https://github.com/antimatter15/whammy (from ffprobe)
  - for use in https://github.com/richtr/NoSleep.js
  - author missing since 2020
- duration shows up for video as 1sec
  - ideally a video of x duration could be generated per media item
  - see mk-video.sh
    - https://stackoverflow.com/questions/11640458/how-can-i-generate-a-video-file-directly-from-an-ffmpeg-filter-with-no-actual-in
    - https://stackoverflow.com/questions/47602824/how-to-speed-up-black-video-creation-with-ffmpeg
    - https://stackoverflow.com/questions/25891342/creating-a-video-from-a-single-image-for-a-specific-duration-in-ffmpeg
    - https://superuser.com/questions/294943/is-there-a-utility-to-create-blank-images
    - https://stackoverflow.com/questions/22965569/convert-from-jpg-to-mp4-by-ffmpeg
  - but that is slow and resulting file sizes are nowhere close to 185 Bytes.
- intend to use it to populate a folder with tons of media (all 3 types supported by simkl)

  - and use it for e2e tests, local test suite
  - gha tests per release. tag only if e2e tests succeed.

- [ ] should this be exposed to the user in the form of exporting the simkl library fully
  - allows users to organise later, replacing with real video files?
  - just export the folder structure without sample.webm?
