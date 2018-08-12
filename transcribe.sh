#!/bin/bash
echo 'start'
if [ -f story.txt ];then
  echo 'found'
  rm story.txt
  echo 'removed'
fi
echo 'transcribing'
#line separated by colon is username:password, output2.wav is source file
curl -X POST -u 5e8808a1-d0e4-47fe-b4bb-f5090beb6d40:OuIEBw4nX56d \
--header "Content-Type: audio/wav" \
--data-binary @output2.wav \
"https://stream.watsonplatform.net/speech-to-text/api/v1/recognize" > story.txt
