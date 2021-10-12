module.exports = function (vars) {

  const { app,
    nanoid,
    limiter,
    checkUploadKey,
    checkAuth,
    checkFileSize,
    express,
    fs,
    util,
    glob: glb,
    prettyBytes,
    nodeHtmlToImage,
    Jimp, ConvertCommand,
    upl,
    hbjs,
    ENV,
    qsToJson,
    fetchVideoInfo,
    ytdl,
    urls,
    rs,
    // s3client 
  } = vars
  const siteUrl = ENV.URL
  const glob = util.promisify(glb)

  app.post('/upload', [limiter, checkUploadKey, checkFileSize, express.text()], async (req, res) => {
    var url = upl.ids[req.discord.id].preferences ? upl.ids[req.discord.id].preferences.domain ? upl.ids[req.discord.id].preferences.domain : 'i.1nch.dev' : 'i.1nch.dev'
    var sent = false
    var id = rs.generate(16)
    urls.new[id] = { uploader: req.discord.id }
    urls.users[req.discord.id] ? urls.users[req.discord.id].push(id) : urls.users[req.discord.id] = [id]
    fs.writeFileSync('./urls.json', JSON.stringify(urls, null, 2))
    var ftype = req.files != null ? req.files.file.mimetype.split('/')[1] : 'txt'
    var fgroup = req.files != null ? req.files.file.mimetype.split('/')[0] : 'text/txt'
    ftype = ftype == 'plain' ? 'txt' : ftype
    function check(id, ftype) {
      if (fs.existsSync(`./uploads/${id}.${ftype}`)) {
        id = rs.generate(16)
        check(id, ftype)
      } else return
    }
    check(id, ftype)
    console.log('writing file', `./uploads/${id}.${ftype}`)
    fs.writeFileSync(`./uploads/${id}.${ftype}`, req.files.file.data ? req.files.file.data : req.body, req.files.file.data ? 'binary' : 'utf8')
    if (fgroup == 'audio') {
      var imageHTML = fs.readFileSync('mp3.html').toString().replace('expressFileName', req.files.file.name).replace('expressFileSize', prettyBytes(req.files.file.size))

      nodeHtmlToImage({
        output: `./uploads/${id}.png`,
        html: imageHTML
      })
        .then(async () => {
          await Jimp.read(`./uploads/${id}.png`).then(f => f.crop(0, 0, 400, 100).write(`./uploads/${id}.png`))
          var Convert = new ConvertCommand(`./uploads/${id}.${ftype}`, 'mp4', `./uploads/${id}.png`)
          Convert.init(function (err, response) {
            if (err) {
              res.status(500).send('' + err)
            } else {
              ftype = 'mp4'
              return res.status(200).json({
                url: `https://${url}/u/${id}.${ftype}`,
                thumbnail_url: `https://${url}/u/${id}.${ftype}`,
                deletion_url: `https://${url}/delimage/${id}.${ftype}?auth=${upl.ids[req.discord.id].key}`
              })
            }
          });
        })
    } else if (fgroup == 'video' && ftype != 'mp4') {
      hbjs.spawn({ input: `./uploads/${id}.${ftype}`, output: `./uploads/${id}.mp4` })
        .on('error', err => {
          res.status(500).send('' + err)
        })
        .on('progress', progress => {
          console.log(progress.percentComplete)
          if (progress.percentComplete == 100 && !sent) {
            var sent = true
            res.status(200).json({
              url: `https://${url}/u/${id}.mp4`,
              thumbnail_url: `https://${url}/u/${id}.mp4`,
              deletion_url: `https://${url}/u/${id}.mp4?auth=${upl.ids[req.discord.id].key}`
            })
          }
        })
    } else {
      res.status(200).json({
        url: `https://${url}/u/${id}.${ftype}`,
        thumbnail_url: `https://${url}/u/${id}.${ftype}`,
        deletion_url: `https://${url}/delimage/${id}.${ftype}?auth=${upl.ids[req.discord.id].key}`
      })
    }
  })

  app.post('/yt', [checkAuth], (req, res) => {

  })

  app.get('/delimage/:id', [checkAuth, checkUploadKey], (req, res) => {
    if (upl.keys[req.query.auth] == req.discord.id) {
      fs.unlinkSync(`./uploads/${req.params.id}`)
      res.status(200).json({
        message: 'OK'
      })
    } else {
      res.status(403).json({
        message: 'Forbidden'
      })
    }
  })

  app.get('/delall', [checkAuth, checkUploadKey], (req, res) => {
    if (upl.keys[req.query.auth] == req.discord.id) {
      urls.users[req.discord.id].forEach(k => {
        glob(`./uploads/${k}.*`).then(files => {
          files.forEach(file => {
            fs.unlinkSync(`${file}`)
          })
        })
      })
      setTimeout(() => {
        res.status(200).json({
          message: 'OK'
        })
      }, 2500)
    } else {
      res.status(403).json({
        message: 'Forbidden'
      })
    }
  })

}