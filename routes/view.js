module.exports = function (vars) {

  const {
    app,
    upl,
    fs,
    mime,
    users,
    atob,
    ENV,
    Colors,
    checkAuth,
    dc,
    objSize,
    client,
    isHexColor,
    urls,
    userSize,
    admins,
    domains,
    templates
  } = vars

  const siteUrl = ENV.URL
  app.get('/u/:id', async (req, res) => {
    if (!(upl.ids[req.params.id.split('-')[0]] || urls.new[req.params.id.split('.')[0]])) return res.redirect('/')
    if (!((upl.ids[req.params.id.split('-')[0]] && upl.ids[req.params.id.split('-')[0]].preferences) || (urls.new[req.params.id.split('.')[0]] && upl.ids[urls.new[req.params.id.split('.')[0]].uploader] && upl.ids[urls.new[req.params.id.split('.')[0]].uploader].preferences))) return res.status(200).redirect('/cdn/' + req.params.id);
    var imageUrl = //'https://' + ENV.CDN_URL + '/' +
      '/cdn/' + req.params.id
    if (!fs.existsSync(`./uploads/${imageUrl.split('/cdn/')[1]}`)) return res.status(404).send('File not found')
    var u = (urls.new[req.params.id.split('.')[0]] ? urls.new[req.params.id.split('.')[0]].uploader : req.params.id.split('-')[0])
    req.discord = dc[u]
    var pref = upl.ids[u].preferences
    var color = pref.color ? (await resolveColor(pref.color.replaceAll('#', ''))).toString(16) : null
    color = color ? color.length == 6 ? color : '0'.repeat(6 - color.length) + color : null
    res.send(mime.lookup('.' + req.params.id.split('.')[1]).split('/')[0] == 'text' ? `<body><pre>${fs.readFileSync(`./uploads/${imageUrl.split('/cdn/')[1]}`).toString().replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>')}</pre></body>` :
      templates.embed.load({
        URL: ENV.URL,
        COLOR: color,
        DISCORD_TAG: req.discord.tag,
        DISCORD_ID: req.discord.id,
        IMAGETYPE: mime.lookup('.' + req.params.id.split('.')[1]).split('/')[0] == 'image' ? 'summary_large_image' : 'player',
        DTYPE: mime.lookup('.' + req.params.id.split('.')[1]).split('/')[0] == 'video' ? `<meta name="twitter:player" content="${imageUrl}">` : `<meta property="og:${mime.lookup('.' + req.params.id.split('.')[1]).split('/')[0]}" content="${imageUrl}">`,
        BODY: mime.lookup('.' + req.params.id.split('.')[1]).split('/')[0] == 'image' ? `<img src="${imageUrl}" alt="image" class="center">` : mime.lookup('.' + req.params.id.split('.')[1]).split('/')[0] == 'video' ? `<video controls><source src="${imageUrl}" type="${mime.lookup('.' + req.params.id.split('.')[1])}"></video>` : '',
        TITLE: pref.title,
        AUTHOR: pref.author,
        DESCRIPTION: pref.desc,
        ASSETS: fs.readFileSync('./assets/style.css').toString().replaceAll('SITE_URL', ENV.URL)
      }))
  })
  app.get('/dl/:id', async (req, res) => {
    return res.status(200).download('./uploads/' + req.params.id).redirect('/')
  })

  app.get('/', [checkAuth], (req, res) => {

    if (req.cookies['discord'] && users.includes(atob(req.cookies['discord'])) && req.discord) {
      console.log(req.discord)
      if (req.discord.invite == null) return res.status(403).redirect('/noinvite')
      res.status(200).send(`
        <!DOCTYPE html>
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
<meta property="og:title" content="private image uploader">
<meta property="og:description" content="made by 1nch">
<meta property="og:image" content="https://${siteUrl}/ico/favicon-32x32.png">
<script src="https://cdn.lr-ingest.io/LogRocket.min.js" crossorigin="anonymous"></script>
<script>window.LogRocket && window.LogRocket.init('${ENV.LOGROCKET_ID}', {shouldCaptureIP: false}); LogRocket.identify('${req.discord.tag}:${req.discord.id}') </script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.0/js/bootstrap.min.js"></script>
<script src="https://unpkg.com/vue/dist/vue.js"></script>
<script src="https://unpkg.com/vuesax@4.0.1-alpha.16/dist/vuesax.min.js"></script>
<script src="/assets/particles.js"></script>
<script>
    particlesJS.load('particles-js', '/assets/particles.json', () => {})
    new Vue({
      el: '#app'
    })
</script>
<title>${siteUrl}</title>
<style>
${fs.readFileSync('./assets/style.css').toString().replaceAll('SITE_URL', ENV.URL)}
</style>
</head>
<body>
<div id="particles-js"></div>
  <div class="front center">
  <div class="center">
${req.discord.id == ENV.DISCORD_OWNER_ID || admins.includes(req.discord.id) || ENV.OWNERS.includes(req.discord.id) ? `<br>Members: ${objSize(dc)}<br>Host Users: ${userSize()}<br><br>` : '<br>'}
<div class="button">
<a href="/pref">
<div class="glow-on-hover">
  Preferences
</div>
  </a>
<a href="/sharexkey"><div class="glow-on-hover">Download Config</div></a>
<a href="/resetkey"><div class="glow-on-hover">Reset Upload Key</div></a>
<br>
${req.discord.id == ENV.DISCORD_OWNER_ID || admins.includes(req.discord.id) || ENV.OWNERS.includes(req.discord.id) ? `<br>
<label for="count">Amount:</label>
<br>
<input type="text" id="count" name="count">
<br>
<a href="javascript:void(0);" onclick="fetch('/admin/invites?count=' + document.getElementById('count').value, {credentials: 'same-origin',method:'POST'}).then(r=>r.json()).then(r => {document.getElementById('p1').innerHTML = '<pre>' + JSON.stringify(r, null, 2).split('\\n').join('<br>') + '</pre>'})">Generate Invite(s)</a>
<br>
<a href="javascript:void(0);" onclick="fetch('/admin/invitewave?count=' + document.getElementById('count').value, {credentials: 'same-origin',method:'POST'}).then(r=>r.json()).then(r => {document.getElementById('p1').innerHTML = '<pre>' + JSON.stringify(r, null, 2).split('\\n').join('<br>') + '</pre>'})">start invite wave</a><br>` : '<br><a href="https://getsharex.com/">Download ShareX</a><br>'}<br>
<a href="javascript:void(0);" onclick="fetch('/invite', {credentials: 'same-origin',method:'POST'}).then(r=>r.json()).then(r => {document.getElementById('p1').innerHTML = document.getElementById('p1').innerHTML + '<br><br><pre>' + JSON.stringify({code: r.code}, null, 2).split('\\n').join('<br>') + '</pre>'; document.getElementById('inv').innerHTML = (r.invites ? \`you have \${r.invites} invites\` : '')})">Generate Invite</a><br>
</p>
<p id="inv">${dc[req.discord.id].invites != null ? `Invites: ${dc[req.discord.id].invites}` : ''}</p>
<p>
<br>
<a href="/clear">Log Out</a>


${req.discord.id == ENV.DISCORD_OWNER_ID || ENV.OWNERS.includes(req.discord.id) || req.discord.id == '328680177066442752' ? `
<br>
<br>
<input type="text" id="eval" name="eval">
<br>
<a href="javascript:void(0);" onclick="fetch('/admin/eval?q=' + document.getElementById('eval').value, {credentials: 'same-origin',method:'POST'}).then(r=>r.json()).then(r => {console.log(( r.r instanceof Object || r.r instanceof Array ? JSON.stringify(r.r, null, 2) : r.r).split('\\n').join('<br>')); document.getElementById('evaled').innerHTML = '<pre>' + ( r.r instanceof Object || r.r instanceof Array ? JSON.stringify(r.r, null, 2) : r.r).split('\\n').join('<br>') + '</pre>'})">
Eval
</a>
<br>
<a href="javascript:void(0);" onclick="fetch('/admin/restart', {credentials: 'same-origin',method:'POST'})">
Restart
</a>
<br>
<br>
</pre>` : ''}
<p id="p1"></p>
<p id="evaled"></p>
${req.discord.id == "499734047908429844" || req.discord.id == "328680177066442752" || req.discord.id == "829877537362542642" || req.discord.id == "776512561583095870" ? `
<img src="https://i.1nch.dev/cdn/SdIIIBbEaK37mnGx.png" class="animegirl">
` : ''}
<div class="footer">
  <p>&#169; 2021, i.1nch.dev. <a href="/credits" style="color: white;">Credits</a></p>
</div>
</div>
</div>
</body>
</html>

`)
    } else {
      return res.redirect('/login');
    }
  });
  app.get('/credits', (req, res) => {
    res.send(`\n
CREDITS: <br>
1nch - Director of Project Management, Owner, Head of Development <br>
Nate - Developer, Owner <br>
Sush - Community Manager, Owner <br>
Chad - Sales Manager, Owner <br>
Agent - Developer <br>
Theo - Developer <br>
Rivage - Got DDoS protection working
`)
  });

  app.get('/noinvite', [checkAuth], (req, res) => {
    res.send(`<!DOCTYPE html>
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
<meta property="og:title" content="private image uploader">
<meta property="og:description" content="made by 1nch">
<meta property="og:image" content="https://${siteUrl}/ico/favicon-32x32.png">
<script src="https://cdn.lr-ingest.io/LogRocket.min.js" crossorigin="anonymous"></script>
<script>window.LogRocket && window.LogRocket.init('${ENV.LOGROCKET_ID}', {shouldCaptureIP: false}); LogRocket.identify('${req.discord.tag}:${req.discord.id}') </script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.0/js/bootstrap.min.js"></script>
<script src="https://unpkg.com/vue/dist/vue.js"></script>
<script src="https://unpkg.com/vuesax@4.0.1-alpha.16/dist/vuesax.min.js"></script>
<script src="/assets/particles.js"></script>
<script>
    particlesJS.load('particles-js', '/assets/particles.json', () => {})
    new Vue({
      el: '#app'
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

<form action="/invite">

  <label for="code">Invite code</label><br>
  <input type="text" id="code" name="code"><br>
  <div class="glow-on-hover"><input type="submit" value="Submit"></div>

</form>
</div>
</body>
</html>

`)
  })

  app.get('/domains', (req, res) => {
    res.send(domains)
  })

  app.get('/discord', (req, res) => {
    res.status(200).redirect(ENV.DISCORD_SERVER_INVITE_URL)
  })

  // below taken from discord.js
  function resolveColor(color) {
    return new Promise((res, rej) => {
      var i = 0
      color = color.includes(',') ? color.split(',')[1] : color
      if (isHexColor(color.replace('#', ''), 'full')) return res(color.replace('#', ''))
      color = color.toLowerCase()
      if (color === 'random') return res(Math.floor(Math.random() * (0xffffff + 1)));
      console.log('color', i++, color)
      if (Colors[color]) return res(Colors[color])
      color = color.replace('#', '');
      console.log('color', i++, color)
      color = !isNaN(parseInt(color)) ? parseInt(color) : 0xffffff;
      console.log('color', i++, color)
      if (color < 0 || color > 0xffffff) return res(0xffffff);
      console.log('color', i++, color)
      return res(color)
    })
  }
}
