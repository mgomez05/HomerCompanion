var http = require('http');
var path = require('path');
var express = require('express');
var fs = require('fs');
var sleep = require('sleep');
var shell = require('shelljs');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false});
var img;
var ImgArr;
var name;
var itransc = "";
var transcription = "";
var storypath = path.join(__dirname, "story.txt");
var keypath = path.join(__dirname,"keyword.txt");
var trspath = path.join(__dirname, 'transcribe.sh');

app.use(express.static(path.join(__dirname,'public')));
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname,'consentPage.html'));
})
app.get('/delivery.js', function(req, res){
    res.sendFile(path.join(__dirname,'delivery.js'));
})
app.post('/Homer', urlencodedParser, function(req, res){
    name = req.body.name;
    res.sendFile(path.join(__dirname, 'diaryPage.html'));
})
app.get('/Diary1', urlencodedParser, function(req, res){
    res.sendFile(path.join(__dirname, 'index.html'));
})
app.get('/Diary2', urlencodedParser, function(req, res){

    console.log("\nCalled /diary2\n");
    shell.rm(keypath);
    if(!fs.existsSync(keypath)){
      fs.writeFileSync(keypath);
    }
    readAudioFile();
    var text = fs.readFileSync(storypath).toString('utf-8');
    console.log('read1');


    var spawn = require("child_process").spawn;
    var pro = spawn('python',["NLU_hackathon.py"]);

    var key = fs.readFileSync(keypath).toString('utf-8');
    console.log('keyfile is: ');
    console.log(key);
    //check if done reading
    while(key.length < 20){
      key = fs.readFileSync(keypath).toString('utf-8');
      console.log('waiting for keys');
      console.log(key);
    }
    console.log('keys file generated')
    var texts="";
    var keys;

    console.log("storypath= " + storypath);

    // var text = fs.readFileSync(storypath).toString('utf-8');
    // while(!(text.includes('e'))){
    //   text = fs.readFileSync(storypath).toString('utf-8');
    //   console.log('no e');
    //   sleep.sleep(10);
    // }
    //var texts = text.split('.');
    //primitive method of splitting every ten spaces
    //var texts = text.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,9}\b/g);
    //console.log("text is "+ texts);
    console.log("orig text is " + text);


    var keys = key.split(',');
    console.log('keysOG: ');
    console.log(keys);
    //sort keywords by first appearance in transcription
    keys.sort(function(a, b) {
      return transcription.indexOf(a)-transcription.indexOf(b);
    });
    console.log("keysSorted:");
    console.log(keys);
    for(var i = keys.length; i>0; i--){
      if(!transcription.includes(keys[i])){
        keys.splice(i);
      }
    }
    console.log('keys recorded, processing text');
    // console.log(keys);
    //put a comma at the halfway point in words between two keywords
    var i1 = 0;
    var i2 = 0;
    for(var i = 0; i<keys.length-1; i++){
      i2 = Math.floor(0.5*(transcription.indexOf(keys[i])+transcription.indexOf(keys[i+1])));
      if(i!==0){ //don't want to find space the first time as will skip words
      i1 = transcription.indexOf(' ', i1);}
      //make sure you don't stop in the middle of a key phrase
      i2 = Math.max(transcription.indexOf(' ', i2), transcription.indexOf(keys[i])+keys[i].length);
      texts+=transcription.substring(i1, i2);
      texts+=',';
      i1 = i2-1;//-1 is so it finds the same space on the next iteration
    }
    texts+=transcription.substring(i2, transcription.length);

    console.log('text processed, text is: '+texts)
    shell.exec('> keyword.txt');
    console.log("keys:");
    console.log(keys);
    console.log("name" + name);
    console.log('text snippets are: ');
    console.log(texts);

    // testPars = ["Sentence 1", "Sentence 2", "Sentence 3"];
    // testKwds = ["apple", "banana", "pear"];
    res.render(path.join(__dirname, 'display.ejs'), {nme: name, pars: texts, kwds: keys, words: text, imgs: ImgArr});
    // res.render(path.join(__dirname, 'display.ejs'), {nme: name, pars: texts, kwds: keys, words: text});

})
app.listen(3000, function() { console.log('listening')});

var io  = require('socket.io').listen(5001),
    dl  = require('delivery')

io.sockets.on('connection', function(socket){
  var delivery = dl.listen(socket);
  delivery.on('receive.success',function(file){
    var params = file.params;
    fs.writeFile(file.name,file.buffer, function(err){
      if(err){
        console.log('File could not be saved.');
      }else{
        console.log('File saved.');
        fs.rename(file.name, 'output2.wav');
      };
    });
  });
});


function readAudioFile(){
  //transcribe using CLI (synchronous) - user:pwd in bash script
  var trsc = shell.exec(trspath);
  //read initial transcription
  console.log('transcription completed, in JS now');
  itransc = fs.readFileSync(storypath);
  itransc = itransc.toString();
  console.log(itransc instanceof String);
  console.log(itransc);
  //loop until transcription is parsed
  console.log('read');
  //note: length of the literal "transcript": " is 15
  while(itransc.includes('"transcript"') && itransc.length - itransc.indexOf('"transcript": "') > 15){
    var st = itransc.indexOf('"transcript": "');
    var end = itransc.indexOf('"', st+15);
    transcription+=itransc.substring(st+15, end);
    itransc = itransc.substring(st+15, itransc.length);
    console.log('itransc is: ');
    console.log(itransc);
  }
  console.log('finished parsing');
  // if(transcription.includes("{")){
  //   var end = itransc.indexOf("{");
  //   transcription = transcription.substring(0,end);
  // }
  //clear file
  shell.rm(storypath);
  console.log('removed file');
  console.log("Transcription is: "+transcription);
  sleep.sleep(15);
  fs.writeFileSync(storypath, transcription);
  console.log('transcribed fully');
// var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
// var fs = require('fs');
//
// var speech_to_text = new SpeechToTextV1({
//   username: '5e8808a1-d0e4-47fe-b4bb-f5090beb6d40',
//   password: 'OuIEBw4nX56d'
// });
//
// // var params = {
// //   objectMode: false,
// //   'content_type': 'audio/wav',
// //   model: 'en-US_BroadbandModel',
// //   keywords: [''],
// //     // 'keywords_threshold': 0,
// //     'max_alternatives': 3
// // };
//
// var params = {
//    "profile": "low_latency",
//    "part_content_type": "audio/wav",
//    "preserveAdaptation": false,
//    "customModels": {},
//    "grammarId": null,
//    "action": "recognize",
//    "grammars": [],
//    "debugStats": false,
//    "timestamps": false,
//    "keywords": [],
//    "amCustomModels": {},
//    "max_alternatives": 1,
//    "profanity_filter": true,
//    "inactivity_timeout": 30,
//    "word_confidence": false,
//    "smart_formatting": false,
//    "languageCustomizationWeights": [],
//    "firstReadyInSession": false,
//    "word_alternatives_threshold": 0.8,
//    "customGrammarWords": [],
//    "languageCustomizationEnabled": [],
//    "speaker_labels": false
// }
//
// // Create the stream.
// var recognizeStream = speech_to_text.createRecognizeStream(params);
//
// // Pipe in the audio.
// fs.createReadStream(path.join(__dirname,'output2.wav')).pipe(recognizeStream);
//
// /*
// * Uncomment the following two lines of code ONLY if `objectMode` is `false`.
// *
// * WHEN USED TOGETHER, the two lines pipe the final transcript to the named
// * file and produce it on the console.
// *
// * WHEN USED ALONE, the following line pipes just the final transcript to
// * the named file but produces numeric values rather than strings on the
// * console.
// */
// recognizeStream.pipe(fs.createWriteStream(path.join(__dirname, 'story.txt')));
//
// /*
// * WHEN USED ALONE, the following line produces just the final transcript
// * on the console.
// */
// // recognizeStream.setEncoding('utf8');
//
// // Listen for events.
// recognizeStream.on('data', function(event) { onEvent('Data:', event); console.log('pie');});
// recognizeStream.on('error', function(event) { onEvent('Error:', event); console.log('err');});
// recognizeStream.on('close', function(event) { onEvent('Close:', event); console.log('close');});
//
// // Display events on the console.
// function onEvent(name, event) {
//   console.log(name, JSON.stringify(event, null, 2));
// };
    // var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
    //
    //
    // var params = {
    //     objectMode: true,
    //     'content_type': 'audio/wav',
    //     model: 'en-US_BroadbandModel',
    //     'keywords_threshold': 0.5,
    //     'max_alternatives': 3
    // };
    //
    // var speech_to_text = new SpeechToTextV1({
    //     username: '5e8808a1-d0e4-47fe-b4bb-f5090beb6d40',
    //     password: 'OuIEBw4nX56d'
    // });
    //
    // // Create the stream.
    // var recognizeStream = speech_to_text.createRecognizeStream(params);
    //
    // // Pipe in the audio.
    // fs.createReadStream('output.wav').pipe(recognizeStream);
    //
    // /*
    //  * Uncomment the following two lines of code ONLY if `objectMode` is `false`.
    //  *
    //  * WHEN USED TOGETHER, the two lines pipe the final transcript to the named
    //  * file and produce it on the console.
    //  *
    //  * WHEN USED ALONE, the following line pipes just the final transcript to
    //  * the named file but produces numeric values rather than strings on the
    //  * console.
    //  */
    // recognizeStream.pipe(fs.createWriteStream(path.join(__dirname,'story.txt')));
    //
    // /*
    //  * WHEN USED ALONE, the following line produces just the final transcript
    //  * on the console.
    //  */
    // recognizeStream.setEncoding('utf8');
    //
    // // Listen for events.
    // recognizeStream.on('data', function(event) { onEvent('Data:', event); });
    // recognizeStream.on('error', function(event) { onEvent('Error:', event); });
    // recognizeStream.on('close', function(event) { onEvent('Close:', event); });
    //
    // // Display events on the console.
    // function onEvent(name, event) {
    //     sleep.sleep(15);
    //     console.log('checking write to story');
    //     console.log(name, JSON.stringify(event, null, 2));
    //     var STR = JSON.stringify(event, null, 2);
    //     var tloc = STR.indexOf("transcript :");
    //     var sloc = STR.indexOf('"', tloc+13);
    //     var eloc = STR.indexOf('"', sloc+2);
    //     STR = STR.substring(sloc, eloc);
    //     if(!STR.includes('e')){
    //     STR="I really like tater tots. They are delicious and made from potatoes.";
    //     }
    //     fs.writeFileSync(path.join(__dirname, "story.txt"),STR, function(err) {
    //          if(err) {
    //              return console.log(err);
    //          }
    //     });
    //
    // };




//get images
//////////////////////



}
