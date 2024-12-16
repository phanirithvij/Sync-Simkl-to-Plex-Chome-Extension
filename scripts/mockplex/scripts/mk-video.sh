#!/usr/bin/env bash

sec=5

ffmpeg -y -f lavfi -i "color=c=black:size=1920x1080" -t $sec small.mp4

# 2hr 2min
duration=$(((2 * 60 + 2) * 60))
# https://stackoverflow.com/a/47604881
for _ in $(seq 1 $((duration / sec))); do
  echo file small.mp4 >>.tmpfile.txt
done

ffmpeg -y -f concat -i .tmpfile.txt -c copy movie.mp4
rm .tmpfile.txt small.mp4

### nix shell nixpkgs#imagemagick.out -c magick -size 1x1 xc:white empty.jpg
### ffmpeg -y -f image2 -i empty.jpg -vcodec libx264 -pix_fmt yuv420p test.mp4
