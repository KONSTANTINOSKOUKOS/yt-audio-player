const { createWriteStream, createReadStream, statSync, readdir, unlink, access,mkdir } = require('fs');
const { Stream, Writable, Readable, Duplex } = require('stream');
const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const path = require('path');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname, 'public'), { immutable: true, cacheControl: true, maxAge: 0 }));//for no caching
const formatres = (res) => {
    return {
        title: res.title,
        author: res.author.name,
        image: res.image,
        duration: {
            seconds: res.duration.seconds,
            timestamp: res.duration.timestamp
        },
        id: res.videoId,
        downloaded: false
    }
}

app.get('/', (req, res) => {
    res.send('yt-audio-player');
});

app.get('/search/:id', async (req, res) => {
    console.log('started search');
    const str = req.params.id.replace('%20', ' ');
    const ress = await yts(str);
    const vid = ress.videos[0];
    console.log('found info');
    console.log(formatres(vid));
    res.send(formatres(vid));
});

app.get('/song/:id', async (req, res) => {
    const ress = await yts({ videoId: req.params.id });
    res.json(formatres(ress));
});

app.get('/playlist/:id', async (req, res) => {
    const ress = await yts({ listId: req.params.id });
    let infos = [];
    ress.videos.forEach(vid => { infos.push(formatres(vid)) });
    res.send(infos);
});

app.get('/convert/:id', (req, res) => {
    ytdl(`https://youtube.com/watch?v=${req.params.id}`, { quality: 'highestaudio' }).pipe(res);
});

app.get('/download/:id', (req, res) => {
    // const pathh = path.join(__dirname, '/tmp');

    // access(pathh,(e)=>{
    //     if(e){
    //         console.log(e);
    //         mkdir(pathh,(e)=> {
    //             if(e) console.log(e);
    //         });
    //     }
    // });

    // readdir(vercel, (e,files)=>{
    //     if(e) console.log(e);

    //     for(const file of files){
    //         unlink(path.join(vercel,file), e => {
    //             if(e) console.log(e);
    //         });
    //     }
    // });

    const stream = ytdl(`https://youtube.com/watch?v=${req.params.id}`, { quality: 'highestaudio' });
    stream.pipe(createWriteStream(`tmp/${req.params.id}.mp3`))
        .on('finish', () => {
            console.log('downloaded ' + req.params.id);
            res.download(path.join(__dirname,`/tmp/${req.params.id}.mp3`));
        });
});

app.listen(process.env.PORT | 5000, () => {
    console.log('app online');
});

module.exports = app;
