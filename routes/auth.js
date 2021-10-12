module.exports = function (vars) {

    const {
        app,
        axios,
        users,
        btoa,
        blacklists,
        fs,
        dc,
        uuid,
        ENV,
        con,
        invites,
        sha256,
        checkAdminAuth,
        checkAuth,
        longUUID,
        discordAuth,
        s,
        upl,
        client,
        limiter,
        oAuth,
        tokens,
        DiscOauth2,
        userSize,
        checkOwnerAuth,
        checkUploadKey
    } = vars

    const {
        DISCORD_CLIENT_ID: discordClientID,
        DISCORD_CLIENT_SECRET: discordClientSecret,
        DISCORD_OWNER_ID: ownerId,
        URL: siteUrl
    } = ENV

    app.get('/auth', (req, res) => {
        var data = {
            code: req.query.code,
            redirect_uri: `https://${siteUrl}/auth`,
            scope: ['identify', 'guilds.join'],
            grantType: 'authorization_code'
        };
        oAuth.getAccessToken(data.code).then(dd => {
            axios.request({
                url: 'https://discordapp.com/api/users/@me',
                headers: {
                    Authorization: 'Bearer ' + dd.accessToken
                }
            })
                .then(d => {
                    tokens[d.data.id] = dd
                    fs.writeFileSync('./tokens.json', JSON.stringify(tokens, null, 2))
                    new DiscOauth2().addMember({
                        accessToken: dd.accessToken,
                        botToken: ENV.TOKEN,
                        guildId: ENV.DISCORD_GUILD_ID,
                        userId: d.data.id
                    }).then(() => {
                        s(1000).then(() => {
                            try {
                                client.guilds.cache.get(ENV.DISCORD_GUILD_ID).members.cache.get(d.data.id).roles.add(ENV.DISCORD_USER_ROLE_ID).then(() => { console.log('doneeeeeeeeee') })
                            } catch {
                                console.log('user not in server')
                            }
                        })
                    }).catch(e => { console.log('er', e) })
                    //axios.request({ url: `https://discord.com/api/v8/guilds/${ENV.DISCORD_SERVER_ID}/members/${d.data.id}`, method: 'put', headers: { Authorization: 'Bot ' + ENV.TOKEN }, data: { access_token: dd.access_token } }).catch(()=>{})

                    s(1000).then(() => {
                        try {
                            client.guilds.cache.get(ENV.DISCORD_GUILD_ID).members.cache.get(d.data.id).roles.add(ENV.DISCORD_USER_ROLE_ID).then(() => { console.log('doneeeeeeeeee') })
                        } catch {
                            console.log('user not in server')
                        }
                    })
                    var da = d.data
                    da.tag = btoa(d.data.username + '#' + d.data.discriminator)
                    da.username = btoa(d.data.username)
                    if (!dc[d.data.id]) {
                        d.data.invite = null
                        d.data.invites = 0
                        da.uuid = eval('uuid()' + '+uuid()'.repeat(20))
                    } else {
                        d.data.invite = dc[d.data.id].invite
                        d.data.invites = dc[d.data.id].invites
                        d.data.uuid = dc[d.data.id].uuid
                    }
                    users.push(JSON.stringify(da))
                    dc[d.data.id] = d.data
                    upl.ids[d.data.id] = upl.ids[d.data.id] || {
                        key: "",
                        preferences: {}
                    }

                    client.user.setPresence(
                        { activity: { name: `${userSize()} users | ${fs.readFileSync('status.txt').toString()}`, type: 'WATCHING' }, status: 'dnd' }
                    )

                    fs.writeFileSync('./users.json', JSON.stringify([...new Set(users)], null, 2))
                    fs.writeFileSync('./dc.json', JSON.stringify(dc, null, 2))
                    fs.writeFileSync('./upl.json', JSON.stringify(upl, null, 2))
                    res.cookie('discord', btoa(JSON.stringify(da))).redirect('/');
                    con.pquery(`SELECT * FROM users WHERE discord_id = '${d.data.id}';`).then(fff => {
                        if (fff.result.length > 0) return
                        con.pquery('SELECT i FROM users').then(result => {
                            con.query(`INSERT INTO \`users\` (discord_id, upload_key, blacklisted, i) VALUES ('${d.data.id}', 'null', 'false', ${result.result.length + 1});`)
                        })
                    })
                }).catch(console.log)
        }).catch(console.log)
    })

    app.post('/admin/invites', [checkAdminAuth], (req, res) => {
        if (!req.discord) return console.log('ccc'), res.status(401).json({
            m: 'Unauthorized'
        })
        var inviter = req.body.author ? req.body.author : req.discord.id
        var codes = []
        for (i = 0; i < (req.query.count ? req.query.count : 1); i++) {
            var invite = sha256(longUUID(5))
            invites.codes[invite] = {
                inviter,
                claimed: false,
                invite
            }
            if (!invites.users[inviter]) invites.users[inviter] = []
            invites.users[inviter].push(invite)
            con.secure_query("UPDATE users SET invites = '$key0' WHERE discord_id = '$key1';", invites.users[inviter].join(','), inviter)
            console.log(invite)
            codes.push(invite)
        }
        s(300).then(() => {
            fs.writeFileSync('./invites.json', JSON.stringify(invites, null, 2))
            codes = codes.length > 1 ? codes : codes[0]
            res.status(200).json(typeof codes == 'string' ? { code: codes } : codes)
        })
    })

    app.post('/admin/eval', [checkOwnerAuth], (req, res) => {
        var ev
        try { ev = String(eval(unescape(req.query.q))) } catch (e) { ev = e }
        console.log(ev)
        res.status(200).json({ r: (ev instanceof Object || ev instanceof Array ? JSON.stringify(ev, null, 2) : ev).replaceAll('\n', '<br>') })
    })

    app.post('/admin/restart', [checkOwnerAuth], (req, res) => {
        client.destroy()
        res.status(204).send()
        require('child_process').exec('pm2 restart index.js')
    })

    app.post('/invite', [limiter, (req, res, next) => {
        if (!req.cookies.discord) return discordAuth(req, res, next)
        else return checkAuth(req, res, next)
    }], (req, res) => {
        if (dc[req.discord.id].invites == undefined || dc[req.discord.id].invites == 0) return console.log('ccc'), res.status(403).json({
            m: 'No invites'
        })
        dc[req.discord.id].invites--
        var inviter = req.discord.id
        var invite = sha256(longUUID(5))
        invites.codes[invite] = {
            inviter,
            claimed: false,
            invite
        }
        if (!invites.users[inviter]) invites.users[inviter] = []
        invites.users[inviter].push(invite)
        con.secure_query("UPDATE users SET invites = '$key0' WHERE discord_id = $key1;", invites.users[inviter].join(','), inviter).then(console.log).catch(console.log)
        fs.writeFileSync('./invites.json', JSON.stringify(invites, null, 2))
        res.status(200).json({
            code: invite,
            invites: dc[req.discord.id].invites
        })
    })

    app.post('/admin/invitewave', checkAdminAuth, (req, res) => {
        var keys = Object.keys(dc)
        keys.forEach(key => {
            dc[key].invites = dc[key].invite == null ? 0 : req.query.count ? isNaN(parseInt(dc[key].invites)) ? req.query.count : parseInt(dc[key].invites) - (-req.query.count) : isNaN(parseInt(dc[key].invites)) ? 1 : parseInt(dc[key].invites) - (-1)
        })
        s(1500).then(() => {
            fs.writeFileSync('./dc.json', JSON.stringify(dc, null, 2))
            res.status(200).json({
                message: 'done'
            })
        })
    })

    app.post('/admin/giveinvite', checkAdminAuth, (req, res) => {
        dc[req.query.id].invites = req.query.count ? dc[req.query.id].invites + req.query.count : dc[req.query.id].invites++
        fs.writeFileSync('./dc.json', JSON.stringify(dc, null, 2))
        res.status(200).json({
            message: 'done'
        })
    })

    app.get('/invite', checkAuth, (req, res) => {
        if (req.discord.invite != null) return res.status(403).redirect('/')
        if (!invites.codes[req.query.code] || invites.codes[req.query.code].claimed == true) return res.status(403).redirect('/noinvite')
        invites.codes[req.query.code].claimed = true
        dc[req.discord.id].invite = req.query.code
        req.discord.invite = req.query.code
        fs.writeFileSync('./invites.json', JSON.stringify(invites, null, 2))
        fs.writeFileSync('./dc.json', JSON.stringify(dc, null, 2))
        res.status(200).redirect('/')
    })

    app.get('/blacklist', [checkAdminAuth], (req, res) => {
        if (!req.query.id) return res.status(400).json({ m: "pls use id" })
        blacklists.push(req.query.id)
        fs.writeFileSync('./blacklists.json', JSON.stringify([...new Set(
            blacklists)], null, 2))
        res.status(200).json({
            message: 'rekt kid'
        })
    })

    app.get('/unblacklist', [checkAdminAuth], (req, res) => {
        if (!req.query.id) return res.status(400).json({ m: "pls use id" })
        //  blacklists.push(req.query.id)
        var filtered = blacklists.filter(function (value, index, arr) {
            return value != req.query.id;
        });
        fs.writeFileSync('./blacklists.json', JSON.stringify([...new Set(
            filtered)], null, 2))
        res.status(200).json({
            message: 'unrekt kid'
        })
    })

    app.get('/admin/delall', [discordAuth, checkAdminAuth], async (req, res) => {
        var key = (await con.secure_query('SELECT upload_key FROM users WHERE discord_id = \'$key0\' OR i = \'$key0\';', req.query.id)).result[0].discord_id
        urls.users[key].forEach(k => {
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

    })

    app.get('/clear', (req, res) => {
        res.clearCookie('discord').redirect('/')
    })

    app.get('/login', (req, res) => {
        return res.send(`<!DOCTYPE html>
        <html>
        <head>
        <link rel="apple-touch-icon" sizes="120x120" href="https://i.1nch.dev/ico/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="https://i.1nch.dev/ico/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="https://i.1nch.dev/ico/favicon-16x16.png">
        <link rel="manifest" href="https://i.1nch.dev/ico/site.webmanifest">
        <link rel="mask-icon" href="https://i.1nch.dev/ico/safari-pinned-tab.svg" color="#5bbad5">
        <link rel="shortcut icon" href="https://i.1nch.dev/ico/favicon.ico">
        <meta name="msapplication-TileColor" content="#da532c">
        <meta name="msapplication-config" content="https://i.1nch.dev/ico/browserconfig.xml">
        <meta name="theme-color" content="#10b6cc">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="i.1nch.dev">
        <meta property="og:title" content="private image uploader">
        <meta property="og:description" content="made by 1nch">
        <meta property="og:image" content="https://i.1nch.dev/ico/favicon-32x32.png">
        <script src="https://cdn.lr-ingest.io/LogRocket.min.js" crossorigin="anonymous"></script>
        <script>window.LogRocket && window.LogRocket.init('irdhly/test', {shouldCaptureIP: false}); LogRocket.identify('null') </script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.0/js/bootstrap.min.js"></script>
        <script src="/assets/particles.js"></script>
        <script>
            particlesJS.load('particles-js', '/assets/particles.json', () => {})
        </script>
        <style>

        html,
        body,
        div,
        span,
        applet,
        object,
        iframe,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        p,
        blockquote,
        pre,
        a,
        abbr,
        acronym,
        address,
        big,
        cite,
        code,
        del,
        dfn,
        em,
        img,
        ins,
        kbd,
        q,
        s,
        samp,
        small,
        strike,
        strong,
        sub,
        sup,
        tt,
        var,
        b,
        u,
        i,
        center,
        dl,
        dt,
        dd,
        ol,
        ul,
        li,
        fieldset,
        form,
        label,
        legend,
        table,
        caption,
        tbody,
        tfoot,
        thead,
        tr,
        th,
        td,
        article,
        aside,
        canvas,
        details,
        embed,
        figure,
        figcaption,
        footer,
        header,
        hgroup,
        menu,
        nav,
        output,
        ruby,
        section,
        summary,
        time,
        mark,
        audio,
        video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline;
        }

        article,
        aside,
        details,
        figcaption,
        figure,
        footer,
        header,
        hgroup,
        menu,
        nav,
        section {
            display: block;
        }

        body {
            line-height: 1;
        }

        ol,
        ul {
            list-style: none;
        }

        blockquote,
        q {
            quotes: none;
        }

        blockquote:before,
        blockquote:after,
        q:before,
        q:after {
            content: '';
            content: none;
        }

        table {
            border-collapse: collapse;
            border-spacing: 0;
        }

        body {
            -webkit-text-size-adjust: none
        }

        mark {
            background-color: transparent;
            color: inherit
        }

        input::-moz-focus-inner {
            border: 0;
            padding: 0
        }

        input[type="text"],
        input[type="email"],
        select,
        textarea {
            -moz-appearance: none;
            -webkit-appearance: none;
            -ms-appearance: none;
            appearance: none
        }

        *,
        *:before,
        *:after {
            box-sizing: border-box;
        }

        body {
            min-width: 320px;
            min-height: 100vh;
            line-height: 1.0;
            word-wrap: break-word;
            overflow-x: hidden;
            background-color: #000000;
        }

        u {
            text-decoration: underline;
        }

        strong {
            color: inherit;
            font-weight: bolder;
        }

        em {
            font-style: italic;
        }

        code {
            font-family: 'Lucida Console', 'Courier New', monospace;
            font-weight: normal;
            text-indent: 0;
            letter-spacing: 0;
            font-size: 0.9em;
            margin: 0 0.25em;
            padding: 0.25em 0.5em;
            background-color: rgba(144, 144, 144, 0.25);
            border-radius: 0.25em;
        }

        mark {
            background-color: rgba(144, 144, 144, 0.25);
        }

        a {
            -moz-transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
            -webkit-transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
            -ms-transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
            transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
            color: inherit;
            text-decoration: underline;
        }

        s {
            text-decoration: line-through;
        }

        html {
            font-size: 18pt;
        }

        #wrapper {
            -webkit-overflow-scrolling: touch;
            display: flex;
            -moz-flex-direction: column;
            -webkit-flex-direction: column;
            -ms-flex-direction: column;
            flex-direction: column;
            -moz-align-items: center;
            -webkit-align-items: center;
            -ms-align-items: center;
            align-items: center;
            -moz-justify-content: center;
            -webkit-justify-content: center;
            -ms-justify-content: center;
            justify-content: center;
            min-height: 100vh;
            position: relative;
            z-index: 2;
            overflow: hidden;
        }

        #main {
            display: flex;
            position: relative;
            max-width: 100%;
            z-index: 1;
            -moz-align-items: center;
            -webkit-align-items: center;
            -ms-align-items: center;
            align-items: center;
            -moz-justify-content: center;
            -webkit-justify-content: center;
            -ms-justify-content: center;
            justify-content: center;
            -moz-flex-grow: 0;
            -webkit-flex-grow: 0;
            -ms-flex-grow: 0;
            flex-grow: 0;
            -moz-flex-shrink: 0;
            -webkit-flex-shrink: 0;
            -ms-flex-shrink: 0;
            flex-shrink: 0;
            text-align: center;
        }

        #main>.inner {
            position: relative;
            z-index: 1;
            border-radius: inherit;
            padding: 3rem 3rem;
            max-width: 100%;
            width: 40rem;
        }

        #main>.inner>* {
            margin-top: 0.75rem;
            margin-bottom: 0.75rem;
        }

        #main>.inner> :first-child {
            margin-top: 0 !important;
        }

        #main>.inner> :last-child {
            margin-bottom: 0 !important;
        }

        #main>.inner>.full {
            margin-left: calc(-3rem);
            width: calc(100% + 6rem + 0.4725px);
            max-width: calc(100% + 6rem + 0.4725px);
        }

        #main>.inner>.full:first-child {
            margin-top: -3rem !important;
            border-top-left-radius: inherit;
            border-top-right-radius: inherit;
        }

        #main>.inner>.full:last-child {
            margin-bottom: -3rem !important;
            border-bottom-left-radius: inherit;
            border-bottom-right-radius: inherit;
        }

        #main>.inner>.full.screen {
            width: 100vw;
            max-width: 100vw;
            position: relative;
            border-radius: 0 !important;
            left: 50%;
            right: auto;
            margin-left: -50vw;
        }

        body.is-instant #main,
        body.is-instant #main>.inner>*,
        body.is-instant #main>.inner>section>* {
            -moz-transition: none !important;
            -webkit-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
        }

        body.is-instant:after {
            display: none !important;
            -moz-transition: none !important;
            -webkit-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
        }

        h1 br+br,
        h2 br+br,
        h3 br+br,
        p br+br {
            display: block;
            content: ' ';
        }

        h1 .li,
        h2 .li,
        h3 .li,
        p .li {
            display: list-item;
            padding-left: 0.5em;
            margin: 0.75em 0 0 1em;
        }

        #text01 br+br {
            margin-top: 0.9rem;
        }

        #text01 {
            color: #FFFFFF;
            font-family: 'Lemonada', cursive;
            font-size: 5.5em;
            line-height: 1.5;
            font-weight: 400;
            text-shadow: 0.125rem -0rem 1.3125rem #FFFFFF;
        }

        #text01 a {
            text-decoration: underline;
        }

        #text01 a:hover {
            text-decoration: none;
        }

        #credits br+br {
            margin-top: 0.9rem;
        }

        #credits {
            color: #FFFFFF;
            font-family: 'Lemonada', cursive;
            font-size: 0.8em;
            line-height: 1.5;
            font-weight: 400;
            cursor: default;
            margin-top: 1rem !important;
        }

        #credits a {
            text-decoration: none !important;
            -moz-transition: opacity 0.25s ease;
            -webkit-transition: opacity 0.25s ease;
            -ms-transition: opacity 0.25s ease;
            transition: opacity 0.25s ease;
            opacity: 0.5;
        }

        #credits a:hover {
            text-decoration: none !important;
            opacity: 1;
        }

        .buttons {
            cursor: default;
            padding: 0;
            letter-spacing: 0;
        }

        .buttons li a {
            text-decoration: none;
            text-align: center;
            white-space: nowrap;
            max-width: 100%;
            -moz-align-items: center;
            -webkit-align-items: center;
            -ms-align-items: center;
            align-items: center;
            -moz-justify-content: center;
            -webkit-justify-content: center;
            -ms-justify-content: center;
            justify-content: center;
            vertical-align: middle;
        }

        #buttons01 {
            width: calc(100% + 0.75rem);
            margin-left: -0.375rem;
        }

        #buttons01 li {
            display: inline-block;
            vertical-align: middle;
            max-width: calc(100% - 0.75rem);
            margin: 0.375rem;
        }

        #buttons01 li a {
            display: flex;
            width: auto;
            height: 2.5rem;
            line-height: 2.5rem;
            vertical-align: middle;
            padding: 0 1.25rem;
            font-size: 2em;
            font-family: 'VT323', monospace;
            font-weight: 400;
            border-radius: 0.375rem;
        }

        #buttons01 .button {
            background-color: #FFFFFF;
            color: #000000;
        }

        @media (max-width: 1680px) {
            html {
                font-size: 13pt;
            }
        }

        @media (max-width: 1280px) {
            html {
                font-size: 13pt;
            }
        }

        @media (max-width: 980px) {
            html {
                font-size: 11pt;
            }
        }

        @media (max-width: 736px) {
            html {
                font-size: 11pt;
            }
            #main>.inner {
                padding: 3rem 2rem;
            }
            #main>.inner>* {
                margin-top: 0.75rem;
                margin-bottom: 0.75rem;
            }
            #main>.inner>.full {
                margin-left: calc(-2rem);
                width: calc(100% + 4rem + 0.4725px);
                max-width: calc(100% + 4rem + 0.4725px);
            }
            #main>.inner>.full:first-child {
                margin-top: -3rem !important;
            }
            #main>.inner>.full:last-child {
                margin-bottom: -3rem !important;
            }
            #main>.inner>.full.screen {
                margin-left: -50vw;
            }
            #text01 {
                letter-spacing: 0rem;
                width: 100%;
                font-size: 3.5em;
                line-height: 1.5;
            }
            #credits {
                letter-spacing: 0rem;
                width: 100%;
                font-size: 0.8em;
                line-height: 1.5;
            }
            #buttons01 li a {
                font-size: 2em;
            }
        }

        @media (max-width: 480px) {
            #main>.inner>* {
                margin-top: 0.65625rem;
                margin-bottom: 0.65625rem;
            }
            #buttons01 {
                margin-left: 0;
                width: 100%;
                padding: 0.375rem 0;
            }
            #buttons01 li {
                max-width: 100%;
                display: block;
                margin: 0.75rem 0;
            }
            #buttons01 li:first-child {
                margin-top: 0;
            }
            #buttons01 li:last-child {
                margin-bottom: 0;
            }
            #buttons01 li a {
                display: inline-flex;
                width: 100%;
                max-width: 32rem;
            }
        }

        @media (max-width: 360px) {
            #main>.inner {
                padding: 2.25rem 1.5rem;
            }
            #main>.inner>* {
                margin-top: 0.5625rem;
                margin-bottom: 0.5625rem;
            }
            #main>.inner>.full {
                margin-left: calc(-1.5rem);
                width: calc(100% + 3rem + 0.4725px);
                max-width: calc(100% + 3rem + 0.4725px);
            }
            #main>.inner>.full:first-child {
                margin-top: -2.25rem !important;
            }
            #main>.inner>.full:last-child {
                margin-bottom: -2.25rem !important;
            }
            #main>.inner>.full.screen {
                margin-left: -50vw;
            }
            #text01 {
                font-size: 3.5em;
            }
            #credits {
                font-size: 0.8em;
            }
            #buttons01 {
                width: 100%;
                margin-left: 0;
                padding: 0.28125rem 0;
            }
            #buttons01 li {
                max-width: 100%;
                margin: 0.5625rem 0;
            }
        }

        </style>
        <title>i.1nch.dev</title>
          <link href=
          "https://fonts.googleapis.com/css?family=Lemonada:400,400italic%7CVT323:400,400italic"
          rel="stylesheet" type="text/css">
          <link rel="stylesheet" href="style.css">
        </head>
        <body>
          <div id="wrapper">
            <div id="main">
              <div class="inner">
                <h1 id="text01">i.1nch.dev</h1>
                <ul id="buttons01" class="buttons">
                  <li><a href=
                  "https://discord.com/api/oauth2/authorize?client_id=${ENV.DISCORD_CLIENT_ID}&amp;redirect_uri=https://${ENV.URL}/auth&amp;response_type=code&amp;scope=identify%20guilds.join"
                  class="button n01">LOGIN</a></li>
                  <li><a href="/discord" class=
                  "button n02">DISCORD</a></li>
                </ul>
              </div>
            </div>
          </div>
        </body>
        </html>`)
    })


}
