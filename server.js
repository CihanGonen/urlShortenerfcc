require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const validUrl = require('valid-url');
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mongooseCihan:uI9BNnd7EyQMo69A@cluster0.u8qja.mongodb.net/mongooseFcc?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
 console.log('mongoose connected');
});

const urlSchema = new Schema({
  url:String,
  shortUrl:String
})

let URI = mongoose.model('URI',urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const findUrl = async (url) =>{
  await URI.findOne({'url':url}).then((res)=>{
    return res;
  })
}

const getKeys = async()=>{
  let keys = await URI.find({}).select({'url':0});
  return keys;
}

app.get('/api/shorturl/:checkUrl',(req,res)=>{
  if(req.params.checkUrl){
    (async ()=>{
      await URI.findOne({'shortUrl':req.params.checkUrl}).then((data)=>{
        try{
          res.redirect(data.url)
        }
        catch{
          res.json({"error":"No short URL found for the given input"});
        }
      })
    })();
  }
  else{
    res.json({ "error": 'invalid url' });
  }
})

app.post('/api/shorturl/',async (req,res)=>{
    const url = req.body.url;
    let shortUrl;
    if(validUrl.isHttpsUri(url) || validUrl.isHttpUri(url)){ 
      if(await URI.findOne({'url':url}).then((res)=>{
        try{
          shortUrl=res.shortUrl;
        }
        catch{
          
        }  
        return res;
      })){
        // bilgileri getir
        res.json({ "original_url" : url, "short_url" : shortUrl})
      }
      else{
        console.log('veritabanında yok');  
        let key = Math.floor(Math.random() * 10000) + 1;
        let i =0;
        while(i===0){
          await URI.findOne({key},(err, data) => {
            if (data) {
              key = Math.floor(Math.random() * 10000) + 1;
            } else {
              i=1;
            }
          })
        }
        console.log('sifre',key);
        const kayit = new URI({
          url,
          shortUrl:key
        })
        await kayit.save().then(console.log('kayıt başarılı'));
        res.json({ "original_url" : kayit.url, "short_url" : kayit.shortUrl})
        //yeni kayıt oluştur
      }
    }
    else{
      res.json({ "error": 'invalid url' });
    }
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
