const express = require('express');
const util = require('util');
const fs = require('fs');
const mysql = require('mysql2');
const prettyBytes = require('pretty-bytes');
const hbjs = require('handbrake-js');
const axios = require('axios');
const validateColor = require("validate-color");
const Jimp = require('jimp');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const ConvertCommand = require('mp3-to-video');
const cookieParser = require('cookie-parser');
const stream = require('stream');
const nodeHtmlToImage = require('node-html-to-image');
const btoa = require('btoa');
const atob = require('atob');
const http = require('http')
const glob = require("glob")
const mime = require('mime-types');
const getDimensions = require('get-video-dimensions');
const socket = require('socket.io')
const colors = require('colors');
const Discord = require('discord.js');
const sha256 = require('sha256');
const DiscordOauth2 = require('discord-oauth2-api')
const DiscOauth2 = require('discord-oauth2')
const ytdl = require('ytdl-core');
const rs = require('randomstring')
const fetchVideoInfo = require('youtube-info');
const isHexColor = require('validate.io-color-hexadecimal');
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const xss = require('xss')
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const LogRocket = require('logrocket')
const helmet = require('helmet')
const Cryptr = require('cryptr')
const path = require('path');

const {
    nanoid
} = require('nanoid');
const {
    MessageButton,
    MessageActionRow
} = require('discord-buttons');
const uuid = nanoid;
const {
    v4: uuidv4
} = require('uuid');

const _require = p => {
    if (!p.startsWith('.')) return require(p)
    return require(path.join(process.cwd(), p))
}

class ImageHost {
    constructor(options) {
        this.options = options;
    }

    init() {
        const options = this.options;
        fs._appendFileSync = fs.appendFileSync
        fs._writeFileSync = fs.writeFileSync
        fs._readFileSync = fs.readFileSync
        fs._appendFile = fs.appendFile
        fs._writeFile = fs.writeFile
        fs._readFile = fs.readFile
        fs._createReadStream = fs.createReadStream
        fs._createWritetream = fs.createWriteStream

        fs.appendFileSync = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._appendFileSync(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }
        fs.writeFileSync = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._writeFileSync(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }
        fs.readFileSync = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._readFileSync(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }
        fs.appendFile = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._appendFile(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }
        fs.writeFile = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._writeFile(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }
        fs.readFile = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._readFile(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }
        fs.createReadStream = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._createReadStream(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }
        fs.createWritetream = function (...arg) {
            let arg2 = [...arg]
            let p = arg2.shift()
            return fs._createWritetream(!p.startsWith('/') ? path.join(__dirname, p) : p, ...arg2)
        }

        const {
            name,
            ERROR_HASH_KEY,
            SQL_CONFIG,
            PORT,
            URL,
            SHAREX_TITLE,
            CF_EMAIL,
            CF_API_KEY,
            CF_ID,
            TOKEN,
            DISCORD_CLIENT_ID,
            DISCORD_CLIENT_SECRET,
            DISCORD_OWNER_ID,
            DISCORD_ADMIN_ROLE_ID,
            PREFIX,
            DISCORD_USER_ROLE_ID,
            DISCORD_GUILD_ID,
            DISCORD_SERVER_INVITE_URL,
            ADMINS,
            OTHER_OWNERS,
            LOGROCKET_ID,
            SENTRY_DSN_URL,
            USER_COUNT_CHANNEL_ID,
            TICKET_CATEGORY_ID
        } = options

        const ENV = {
            ...process.env,
            ERROR_HASH_KEY,
            PORT,
            URL,
            SHAREX_TITLE,
            CF_EMAIL,
            CF_API_KEY,
            CF_ID,
            TOKEN,
            DISCORD_CLIENT_ID,
            DISCORD_CLIENT_SECRET,
            DISCORD_OWNER_ID,
            DISCORD_ADMIN_ROLE_ID,
            PREFIX,
            DISCORD_USER_ROLE_ID,
            DISCORD_GUILD_ID,
            DISCORD_SERVER_INVITE_URL,
            ADMINS,
            OTHER_OWNERS,
            LOGROCKET_ID,
            SENTRY_DSN_URL,
            SQL_CONFIG,
            USER_COUNT_CHANNEL_ID,
            TICKET_CATEGORY_ID
        }

        const fullopts = {
            ...process.env,
            ...options
        }

        const requiredParams = [
            'PORT',
            'URL',
            'SHAREX_TITLE',
            'CF_EMAIL',
            'CF_API_KEY',
            'CF_ID',
            'TOKEN',
            'DISCORD_CLIENT_ID',
            'DISCORD_CLIENT_SECRET',
            'DISCORD_OWNER_ID',
            'DISCORD_ADMIN_ROLE_ID',
            'PREFIX',
            'DISCORD_USER_ROLE_ID',
            'DISCORD_GUILD_ID',
            'DISCORD_SERVER_INVITE_URL',
            'ADMINS',
            'OTHER_OWNERS',
            'LOGROCKET_ID',
            'SENTRY_DSN_URL',
            'SQL_CONFIG',
            'ERROR_HASH_KEY',
            'USER_COUNT_CHANNEL_ID',
            'TICKET_CATEGORY_ID'
        ]

        const errors = [];

        for (const param of requiredParams)
            if (!fullopts.hasOwnProperty(param)) errors.push(param);

        if (errors.length > 0)
            throw new Error(
                `Missing paramater${errors.length > 1 ? "s" : ""} ${errors.join(", ")} ${errors.length > 1 ? "are" : "is"} required in environment variables or options object`
            );
        const app = express();
        const server = http.createServer(app)
        const errorHash = new Cryptr(ERROR_HASH_KEY)
        const invites = _require('./invites.json');
        const tokens = _require('./tokens.json')
        const urls = _require('./urls.json')
        const users = _require('./users.json');
        const upl = _require('./upl.json');
        const dc = _require('./dc.json');
        const blacklists = _require('./blacklists.json');
        const templates = require('./templates.js')
        const domains = [...new Set(_require('./domains.json'))]

        ENV.AUTH = longUUID(30);
        ENV.OWNERS = String(OTHER_OWNERS).split(',')
        ENV.ADMINS = String(ADMINS)

        app.use((req, res, next) => {
            res.send('hi')
            if (req.headers['cf-connecting-ip']) next()
        })

        app.use(async (req, res, next) => {
            if (req.hostname !== ENV.URL) {
                return res.redirect(`https://${ENV.URL}${req.originalUrl}`)
            } else next()
        })

        const crypt = new Cryptr(longUUID(10))

        const oAuth = new DiscordOauth2({
            clientID: ENV.DISCORD_CLIENT_ID,
            clientSecret: ENV.DISCORD_CLIENT_SECRET,
            redirectURI: `https://${ENV.URL}/auth`,
            scopes: ['identify', 'guilds.join']
        });

        const oa2 = new DiscOauth2({
            clientId: ENV.DISCORD_CLIENT_ID,
            clientSecret: ENV.DISCORD_CLIENT_SECRET,
            redirectUri: `https://${ENV.URL}/auth`,
            scope: ['identify', 'guilds.join']
        });

        Sentry.init({
            dsn: ENV.SENTRY_DSN_URL,
            integrations: [
                new Sentry.Integrations.Http({
                    tracing: true
                }),
                new Tracing.Integrations.Express({
                    app
                }),
            ],
            tracesSampleRate: 1.0,
        });

        app.use(Sentry.Handlers.requestHandler());

        app.use(Sentry.Handlers.tracingHandler());

        app.use(cookieParser());

        app.use(express.json())

        var admins = ENV.ADMINS.split(',')

        app.set('trust proxy', true);

        app.use('/ico', express.static('ico'));
        app.use('/cdn', express.static('uploads'));

        const s = m => {
            return new Promise(r => setTimeout(r, m));
        };

        function qsToJson(qs) {
            var res = {};
            var pars = qs.split('&');
            var kv, k, v;
            for (i in pars) {
                kv = pars[i].split('=');
                k = kv[0];
                v = kv[1];
                res[k] = decodeURIComponent(v);
            }
            return res;
        }

        const limiter = rateLimit({
            windowMs: 5 * 1000,
            max: 5,
            keyGenerator: req => req.headers['cf-connecting-ip']
        });

        const objSize = function (obj) {
            var size = 0,
                key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

        function userSize() {
            var size = 0,
                key,
                obj = dc;
            for (key in obj) {
                if (obj.hasOwnProperty(key) && obj[key].invite !== null) size++;
            }
            return size;
        };

        const client = new Discord.Client();
        const DiscordButtons = require('discord-buttons')(client)

        //taken from discord.js

        const Colors = {
            DEFAULT: 0x000000,
            WHITE: 0xffffff,
            AQUA: 0x1abc9c,
            GREEN: 0x2ecc71,
            BLUE: 0x3498db,
            YELLOW: 0xffff00,
            PURPLE: 0x9b59b6,
            LUMINOUS_VIVID_PINK: 0xe91e63,
            GOLD: 0xf1c40f,
            ORANGE: 0xe67e22,
            RED: 0xe74c3c,
            GREY: 0x95a5a6,
            NAVY: 0x34495e,
            DARK_AQUA: 0x11806a,
            DARK_GREEN: 0x1f8b4c,
            DARK_BLUE: 0x206694,
            DARK_PURPLE: 0x71368a,
            DARK_VIVID_PINK: 0xad1457,
            DARK_GOLD: 0xc27c0e,
            DARK_ORANGE: 0xa84300,
            DARK_RED: 0x992d22,
            DARK_GREY: 0x979c9f,
            DARKER_GREY: 0x7f8c8d,
            LIGHT_GREY: 0xbcc0c0,
            DARK_NAVY: 0x2c3e50,
            BLURPLE: 0x7289da,
            GREYPLE: 0x99aab5,
            DARK_BUT_NOT_BLACK: 0x2c2f33,
            NOT_QUITE_BLACK: 0x23272a
        };

        function checkAuth(req, res, next) {
            console.log(req.cookies)
            if (!req.cookies.discord) return res.status(403).redirect('/login')
            let ck = JSON.parse(atob(req.cookies.discord))
            console.log(ck)
            if (!users.includes(JSON.stringify(ck))) {
                return res.status(403).redirect('/login');
            }
            if (blacklists.includes(ck.id))
                return res.status(401).json({
                    message: 'You are blacklisted from using this service!',
                    code: 401
                });
            try {
                ck.username = atob(ck.username)
            } catch { }
            try {
                ck.tag = atob(ck.tag)
            } catch { }
            req.discord = dc[ck.id]
            next();
        }

        function checkUploadKey(req, res, next) {
            if (req.query.auth in upl.keys) req.discord = dc[upl.keys[req.query.auth]];
            else
                return res.status(401).json({
                    message: 'Invalid key'
                });
            next();
        }

        function checkFileSize(req, res, next) {
            if (upl.keys[req.query.auth] == ENV.DISCORD_OWNER_ID || ENV.OWNERS.includes(upl.keys[req.query.auth]))
                return fileUpload({
                    limits: 1000 * 1000 * 1000
                })(req, res, next);
            return fileUpload({
                limits: 50 * 1000 * 1000
            })(req, res, next);
        }

        function checkAdminAuth(req, res, next) {
            if (req.cookies.discord && users.includes(atob(req.cookies.discord))) {
                req.discord = JSON.parse(atob(req.cookies.discord))
            }

            var author = req.body ? req.body.author : req.discord ? req.discord.id : null
            console.log(req.body)

            if (req.headers.authorization && req.headers.authorization == ENV.AUTH) {
                try {
                    req.discord = dc[author]
                } catch {
                    console.log('aaa');
                    return res.status(403).redirect('/')
                }
                return next();
            }

            try {
                req.discord = JSON.parse(atob(req.cookies['discord']))
            } catch {
                try {
                    req.discord = dc[author]
                } catch {
                    console.log('aaa');
                    return res.status(403).redirect('/')
                }
            }
            if (req.discord.id != ENV.DISCORD_OWNER_ID && !admins.includes(req.discord.id)) {
                return res.status(403).redirect('/');
            } else next()
        }

        function checkOwnerAuth(req, res, next) {
            try {
                req.discord = JSON.parse(atob(req.cookies['discord']))
            } catch {
                res.status(403).redirect('/')
            }
            console.log('afafaf')
            if (req.discord.id != ENV.DISCORD_OWNER_ID && !ENV.OWNERS.includes(req.discord.id)) {
                return res.status(403).redirect('/');
            } else next()
        }

        function discordAuth(req, res, next) {
            if (req.headers.authorization &&
                crypt.decrypt(req.headers.authorization).split('Discord ')[1] in dc) {

                req.discord = dc[crypt.decrypt(req.headers.authorization).split('Discord ')[1]]
                console.log(req.discord)
                if (req.discord != undefined)
                    return next()
                else return res.status(403).json({
                    message: 'Forbidden'
                })
            } else return res.status(401).json({
                message: 'Unauthorized'
            })
        }

        var con = (con = mysql.createConnection(SQL_CONFIG));

        con.connect(err => {
            if (err) {
                log('[ERROR] An error has occurred while connection: ' + err, 'red');
                log(
                    '[INFO] Attempting to establish connection with SQL database.',
                    'yellow'
                );
                setTimeout(handleConnection, 2000);
            } else {
                log('[SUCCESS] SQL database connection established successfully.', 'green');
            }
        });

        con.secure_query = (...argument) => {
            var args = [...argument];
            var query = args.shift();
            var keys = args;
            return new Promise((res, rej) => {
                var regex = /\$key[0-9]*/g
                var matches = [...query.match(regex)]

                var q = query
                matches.forEach(match => {
                    q = q.split(match).join(escape(keys[parseInt(match.split('$key')[1])]))
                })
                con.query(q, (err, result, fields) => {
                    if (err) rej(err);
                    else
                        res({
                            result,
                            fields
                        });
                });
            });
        };

        con.pquery = q => {
            return new Promise((res, rej) => {
                con.query(q, (err, result, fields) => {
                    if (err) rej(err);
                    else
                        res({
                            result,
                            fields
                        });
                });
            });
        };

        function log(text, color) {
            let d = new Date(),
                h = d.getHours(),
                m = d.getMinutes(),
                ap = 'AM';
            if (h > 12) {
                h -= 12;
                ap = 'PM';
            }
            if (m < 10) {
                m = '0' + m;
            }
            let time = h + ':' + m + ' ' + ap;

            if (typeof color == 'undefined') {
                console.log(colors.grey(time) + ' : ' + text);
            }
            if (typeof color != 'undefined') {
                console.log(colors.grey(time) + ' : ' + colors[color](text));
            }
        }

        function handleConnection() {
            con = mysql.createConnection(SQL_CONFIG);

            con.connect(err => {
                if (err) {
                    log('[ERROR] An error has occurred while connection: ' + err, 'red');
                    log(
                        '[INFO] Attempting to establish connection with SQL database.',
                        'yellow'
                    );
                    setTimeout(handleConnection, 2000);
                } else {
                    log(
                        '[SUCCESS] SQL database connection established successfully.',
                        'green'
                    );
                }
            });

            con.on('error', err => {
                console.log('Error: ' + err);
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    handleConnection();
                } else {
                    throw err;
                }
            });
        }

        function longUUID(c) {
            return eval('nanoid()' + '+nanoid()'.repeat(c));
        }

        const headers = {
            'X-Auth-Key': ENV.CF_API_KEY,
            'X-Auth-Email': ENV.CF_EMAIL
        };

        async function request(url, d = {}) {
            var head = d.headers ? d.headers : {}
            var method = d.method ? d.method : 'get'
            var data = d.data ? d.data : {}

            return axios.request({
                url: 'https://' + ENV.URL + url,
                method: method ? method : 'get',
                headers: head != null ? {
                    ...headers,
                    ...head
                } : headers,
                data: data
            });
        }

        client.login(ENV.TOKEN)

        require('./router.js')({
            express,
            app,
            prettyBytes,
            fs,
            hbjs,
            axios,
            Jimp,
            rateLimit,
            fileUpload,
            ConvertCommand,
            cookieParser,
            stream,
            nodeHtmlToImage,
            btoa,
            atob,
            mime,
            getDimensions,
            blacklists,
            users,
            upl,
            dc,
            nanoid,
            uuid,
            uuidv4,
            limiter,
            checkAuth,
            checkUploadKey,
            checkFileSize,
            s,
            ENV,
            log,
            handleConnection,
            Colors,
            con,
            Discord,
            longUUID,
            checkAdminAuth,
            invites,
            sha256,
            discordAuth,
            objSize,
            validateColor,
            client,
            domains,
            tokens,
            oAuth,
            DiscOauth2,
            qsToJson,
            ytdl,
            fetchVideoInfo,
            isHexColor,
            urls,
            rs,
            oa2,
            escapeRegex,
            userSize,
            admins,
            xss,
            checkOwnerAuth,
            LogRocket,
            Sentry,
            Tracing,
            helmet,
            Cryptr,
            crypt,
            glob,
            util,
            request,
            socket,
            http,
            server,
            DiscordButtons,
            MessageButton,
            MessageActionRow,
            templates,
            errorHash,
            path
        });

        app.get('/errtest', (req, res) => {
            throw e
        })

        app.use(Sentry.Handlers.errorHandler());

        LogRocket.getSessionURL(sessionURL => {
            Sentry.configureScope(scope => {
                scope.setExtra("sessionURL", sessionURL);
            });
        });

        app.use(function onError(err, req, res, next) {
            res.statusCode = 500;
            res.end(`There was an error and it has been reported to sentry. Please ping ${name}, make a ticket, or DM ${name} with this code: ` + errorHash.encrypt(util.inspect(err)));
        });

        server.listen(PORT);
    }
}

module.exports = ImageHost

module.exports.build = function (fpath) {
    if (!path.isAbsolute(fpath) || !fpath) throw new Error("Path must be absolute");

    const square = [
        'blacklists',
        'domains',
        'users'
    ]

    const curly = [
        'dc',
        'tokens'
    ]

    square.forEach(file => {
        write(file + '.json', '[]')
    })

    curly.forEach(file => {
        write(file + '.json', '{}')
    })

    write('invites.json', '{"codes":{},"users":{}}')
    write('upl.json', '{"keys": {},"ids": {}}')
    write('urls.json', '{"new": {},"users": {}}')
    write('restart-msg.txt', 'done')
    write('index.js', `const Host = require('instant-image-host')
new Host({
    name: '',
    PORT: 0,
    URL: '',
    SHAREX_TITLE: '',
    CF_EMAIL: '',
    CF_API_KEY: '',
    CF_ID: '',
    TOKEN: '',
    DISCORD_CLIENT_ID: '',
    DISCORD_CLIENT_SECRET: '',
    DISCORD_OWNER_ID: '',
    DISCORD_ADMIN_ROLE_ID: '',
    PREFIX: '',
    DISCORD_USER_ROLE_ID: '',
    DISCORD_GUILD_ID: '',
    DISCORD_SERVER_INVITE_URL: '',
    ADMINS: [''],
    OTHER_OWNERS: [''],
    GITHUB_USER: '',
    GITHUB_PASS: '',
    GITHUB_REPO: '',
    LOGROCKET_ID: '',
    SENTRY_DSN_URL: '',
    SQL_CONFIG: {
        host: "",
        user: "",
        password: "",
        database: ""
    },
    ERROR_HASH_KEY: '',
    USER_COUNT_CHANNEL_ID: '',
    TICKET_CATEGORY_ID: ''
})`)

    function write(f, d) {
        fs.writeFileSync(path.join(fpath, f), d)
    }
}