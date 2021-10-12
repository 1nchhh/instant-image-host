module.exports = function(vars) {

    const { app, uuid, stream, upl, fs, checkAuth, limiter, ENV, con, Colors, axios, domains, xss } = vars
    const { URL: siteUrl, SHAREX_TITLE: sharexTitle } = ENV
    app.get('/sharexkey', checkAuth, async(req, res) => {
        var r = await con.pquery(`SELECT upload_key FROM users WHERE discord_id = '${req.discord.id}'`).then(r => r.result[0])
        console.log(r)
        var key = r.upload_key != 'null' ? r.upload_key : eval('uuid()' + '+uuid()'.repeat(10))
        var fileContents = Buffer.from(`{
      "Version": "13.3.0",
      "Name": "${sharexTitle}",
      "DestinationType": "ImageUploader, TextUploader, FileUploader",
      "RequestMethod": "POST",
      "RequestURL": "https://${siteUrl}/upload",
      "Parameters": {
        "auth": "${key}"
      },
      "Body": "MultipartFormData",
      "FileFormName": "file",
      "URL": "$json:url$",
      "ThumbnailURL": "$json:thumbnail_url$",
      "DeletionURL": "$json:deletion_url$",
      "ErrorMessage": "$json:error$"
    }`);

        if (r.upload_key != 'null') con.pquery(`UPDATE users SET upload_key = '${key}' WHERE discord_id = '${req.discord.id}';`)

        var readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.set('Content-disposition', 'attachment; filename=' + req.discord.username + '.sxcu');
        res.set('Content-Type', 'text/plain');

        readStream.pipe(res);

        if (req.discord.id in upl.ids) {
            delete upl.keys[upl.ids[req.discord.id]]
        }
        upl.keys[key] = req.discord.id
        upl.ids[req.discord.id] = upl.ids[req.discord.id] ? upl.ids[req.discord.id] : {
            key,
            preferences: {}
        }
        fs.writeFileSync('./upl.json', JSON.stringify(upl, null, 2))
    })
    app.get('/resetkey', checkAuth, async(req, res) => {
        var key = eval('uuid()' + '+uuid()'.repeat(10))
        var fileContents = Buffer.from(`{
      "Version": "13.3.0",
      "Name": "${sharexTitle}",
      "DestinationType": "ImageUploader, TextUploader, FileUploader",
      "RequestMethod": "POST",
      "RequestURL": "https://${siteUrl}/upload",
      "Parameters": {
        "auth": "${key}"
      },
      "Body": "MultipartFormData",
      "FileFormName": "file",
      "URL": "$json:url$",
      "ThumbnailURL": "$json:thumbnail_url$",
      "DeletionURL": "$json:deletion_url$",
      "ErrorMessage": "$json:error$"
    }`);

        var readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.set('Content-disposition', 'attachment; filename=' + req.discord.username + '.sxcu');
        res.set('Content-Type', 'text/plain');

        readStream.pipe(res);

        if (req.discord.id in upl.ids) {
            delete upl.keys[upl.ids[req.discord.id].oldkey]
        }
        upl.keys[key] = req.discord.id
        upl.ids[req.discord.id] = {
            key,
            ...upl.ids[req.discord.id]
        }
        fs.writeFileSync('./upl.json', JSON.stringify(upl, null, 2))
    })
    app.get('/options', [limiter, checkAuth], (req, res) => {
        for (var q in req.query) {
            req.query[q] = xss(req.query[q])
        }

        var {
            color,
            desc,
            title,
            author,
            domain,
            subdomain
        } = req.query

        upl.ids[req.discord.id].preferences = {
            author,
            title,
            desc,
            color,
            domain: domain == '1nch.dev' ? 'i.1nch.dev' : (subdomain ? subdomain + '.' : '') + domain
        }

        console.log(upl.ids[req.discord.id].preferences)

        fs.writeFileSync('./upl.json', JSON.stringify(upl, null, 2))

        res.status(200)
            .redirect('/')
    })

    app.get('/pref', [checkAuth], async(req, res) => {
        var d = []
        domains.forEach(domain => {
            d.push(`<option value="${domain}">${domain}</option>`)
        })
        res.status(200).send(`<!DOCTYPE html>
    <html>
    <head>
    <link rel="apple-touch-icon" sizes="120x120" href="https://${siteUrl}/ico/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://${siteUrl}/ico/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://${siteUrl}/ico/favicon-16x16.png">
    <link rel="manifest" href="https://${siteUrl}/ico/site.webmanifest">
    <link rel="mask-icon" href="https://${siteUrl}/ico/safari-pinned-tab.svg" color="#5bbad5">
    <link rel="shortcut icon" href="https://${siteUrl}/ico/favicon.ico">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="msapplication-config" content="https://${siteUrl}/ico/browserconfig.xml">
    <meta name="theme-color" content="#10b6cc">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${siteUrl}">
    <meta property="og:title" content="public image uploader">
    <meta property="og:description" content="made by 1nch">
    <meta property="og:image" content="https://${siteUrl}/ico/favicon-32x32.png">
    <script src="https://cdn.lr-ingest.io/LogRocket.min.js" crossorigin="anonymous"></script>
    <script>window.LogRocket && window.LogRocket.init('${ENV.LOGROCKET_ID}', {shouldCaptureIP: false}); LogRocket.identify('${req.discord.tag}:${req.discord.id}') </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.0/js/bootstrap.min.js"></script>
    <script src="/assets/particles.js"></script>
    <script>
        particlesJS.load('particles-js', '/assets/particles.json', () => {})
    </script>

    <script>
   document.getElementById('col').addEventListener('input', () => {document.getElementById('color').value = document.getElementById('col').value});
    fetch('/domains').then(r=>r.json()).then(domains => {document.getElementById('domain').innerHTML = domains.map(domain => \`<option value="\${domain}">\${domain}</option>\`).join('<br>');
})
    </script>
    <title>${siteUrl}</title>
    <style>
    ${fs.readFileSync('./assets/style.css').toString().replaceAll('SITE_URL', ENV.URL)}
    </style>
    </head>
    <body>
    <div id="particles-js" class="behind"></div>
      <div class="front center">
    <form action="/options">
      <label for="author">Author</label><br>
      <input type="text" id="author" name="author"><br>
      <label for="title">Title</label><br>
      <input type="text" id="title" name="title"><br>
      <label for="desc">Description</label><br>
      <input type="text" id="desc" name="desc"><br>
      <input type="color" id="col" name="clr"><br>
      <label for="color">Color</label><br>
      <input type="text" id="color" name="color"><br>
      <label for="subdomain">subdomain</label><br>
      <input type="text" id="subdomain" name="subdomain"><br>
      <label for="domain">domain</label><br>
      <select id="domain" name="domain">
${d.join('<br>')}
    </select><br>
      <input type="submit" value="Submit">
    </form>
    </div>

    </body>

    </html>`)
    })

}