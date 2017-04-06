#!/bin/sh

# with a bash for loop
printf "file '%s'\n" ./process/*.ts > convert.txt
F:\__apps\ffmpeg\bin\ffmpeg -f concat -safe 0 -i convert.txt -c copy output.mp4