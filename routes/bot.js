console.log('bot start');
const { request } = require('http');

module.exports = function (vars) {
  const {
    Discord,
    dc,
    DiscOauth2,
    client,
    ENV,
    escapeRegex,
    axios,
    tokens,
    userSize,
    fs,
    invites: invitez,
    s,
    con,
    crypt,
    request,
    DiscordButtons,
    MessageButton,
  } = vars;

  function clean(text) {
    if (typeof text === 'string')
      return text
        .replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203));
    else return text;
  }

  const headers = {
    authorization: ENV.AUTH,
  };

  const { PREFIX } = ENV;

  const { MessageEmbed, MessageAttachment, DiscordAPIError } = Discord;

  client.on('ready', () => {
    console.log('Bot is online!');
    if (
      fs.readFileSync('restart-msg.txt').toString().split('\n')[0] != 'done'
    ) {
      client.channels.cache
        .get(fs.readFileSync('restart-msg.txt').toString().split(':')[0])
        .messages.fetch({
          around: fs
            .readFileSync('restart-msg.txt')
            .toString()
            .split(':')[1]
            .split('\n')[0],
          limit: 1,
        })
        .then((m) => {
          m.first().edit('Restarted!');
        });
      fs.writeFileSync('restart-msg.txt', 'done');
    }
    client.user.setPresence({
      activity: {
        name: `${userSize()} users | ${fs
          .readFileSync('status.txt')
          .toString()}`,
        type: 'WATCHING',
      },
      status: 'dnd',
    });
  });

  client.on('ready', () => {
    setInterval(function () {
      client.guilds
        .fetch(ENV.DISCORD_GUILD_ID)
        .then((guild) => {
          guild.channels.cache
            .find((c) => c.id == ENV.USER_COUNT_CHANNEL_ID)
            .edit({
              name: '😛┋User Count: ' + userSize(),
            });
        })
        .catch((e) => console.log(e));
    }, 30000);
  });

  client.on('clickButton', async (button) => {
    button.defer();

    if (button.id == 'createTicket') {
      message = button;
      message.author = button.clicker.user;
      const support = message.guild.roles.cache.get(ENV.DISCORD_ADMIN_ROLE_ID);
      const loading1 = new MessageEmbed()

        .setTitle('Creating ticket...')
        .setColor('#FFBF00')
        .setDescription('Making your ticket channel...');

      const loading2 = new MessageEmbed()

        .setTitle('Creating ticket...')
        .setColor('#FFBF00')
        .setDescription('Updating permissions...');

      const loading3 = new MessageEmbed()

        .setTitle('Creating ticket...')
        .setColor('#FFBF00')
        .setDescription('Finishing things up...');

      if (
        message.guild.channels.cache.find(
          (channel) => channel.name === `ticket-${message.author.id}`
        )
      ) {
        const ticket_error = new MessageEmbed()

          .setTitle('Error!')
          .setColor('#FF0000')
          .setDescription(
            `You already have a ticket open, please close your existing ticket first before opening a new one!`
          );
        message.author.send(ticket_error);
      } else {
        message.guild.channels
          .create(`ticket-${message.author.id}`, {
            permissionOverwrites: [
              {
                id: message.guild.roles.everyone,
                deny: ['VIEW_CHANNEL'],
              },
            ],
            type: 'text',
            parent: ENV.TICKET_CATEGORY_ID,
          })
          .then(async (channel) => {
            const ticket_create = new MessageEmbed()

              .setTitle('Success!')
              .setColor('#00FF00')
              .setDescription(
                `You have successfully created a ticket! Please click on ${channel} to view your ticket.`
              );
            message.author.send(loading1).then((msg) => {
              setTimeout(function () {
                msg.edit(loading2).then((msg2) => {
                  setTimeout(function () {
                    msg2.edit(loading3).then((msg3) => {
                      setTimeout(function () {
                        channel.updateOverwrite(message.author.id, {
                          VIEW_CHANNEL: true,
                          SEND_MESSAGES: true,
                        });
                        channel.updateOverwrite(support, {
                          VIEW_CHANNEL: true,
                          SEND_MESSAGES: true,
                        });
                        channel.setTopic('Open');
                        msg3.edit(ticket_create);
                      }, 200);
                    });
                  }, 300);
                });
              }, 300);
            });
            const ticket_welcome = new MessageEmbed()

              .setTitle('Welcome!')
              .setColor('#00FF00')
              .setDescription(
                `Hello ${message.author}! Welcome to your ticket! Please be patient and ping an online staff member, we will be with you shortly. If you would like to close this ticket please run \`.close\``
              );
            channel.send(ticket_welcome);
            let logchannel = message.guild.channels.cache.find(
              (channel) => channel.name === `ticket-logs`
            );
            if (logchannel) {
              const ticket_log = new MessageEmbed()

                .setTitle('Ticket created!')
                .setColor('#00FF00')
                .setDescription(
                  `A ticket has been created by <@!${message.author.id}> Please click on ${channel} to view the ticket.`
                );
              logchannel.send(ticket_log);
            }
          });
      }
    }

    if (button.id == 'restartvps') {
      if (!button.clicker.user.id == ENV.DISCORD_OWNER_ID) return;

      var restartEmbed = new Discord.MessageEmbed()
        .setTitle('Restarting VPS')
        .setDescription(
          `Restarted by ${button.clicker.member.user.username}#${button.clicker.member.user.discriminator}`
        )
        .setColor('#ff0000')
        .setTimestamp();
      button.channel.send(restartEmbed);
      require('child_process').exec('sudo shutdown -r 0');
    }

    button.defer();
  });

  client.on('message', async (message) => {
    console.log(message.content);
    if (message.author.bot) return;
    if (!message.guild) return;
    const prefixRegex = new RegExp(
      `^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\s*`
    );
    if (!prefixRegex.test(message.content)) return;
    const [, matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command == 'genkey') {
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        axios
          .request({
            url: `https://${ENV.URL}/admin/invites`,
            method: 'post',
            headers,
            data: {
              author: message.author.id,
            },
          })
          .then((d) => {
            message.channel.send('Sent invite in dms.');
            (message.mentions.users.first()
              ? message.mentions.users.first()
              : message.author
            ).send('Your key is `' + d.data.code + '`');
          });
      } else {
        if (!dc[message.author.id]) {
          return message.channel.send(
            `You have not registered an account or the database was wiped. to fix this, go to https://${ENV.URL}/`
          );
        }
        axios
          .request({
            url: `https://${ENV.URL}/invite`,
            method: 'post',
            headers: {
              authorization: crypt.encrypt('Discord ' + message.author.id),
            },
          })
          .then((d) => {
            message.channel.send('Sent invite in dms.');
            (message.mentions.users.first()
              ? message.mentions.users.first()
              : message.author
            ).send('Your key is `' + d.data.code + '`');
          })
          .catch((e) => {
            console.log(e);
            message.channel.send(
              e.response.status == 403
                ? 'Insufficient amount of invites.'
                : e.response.data.message
                  ? e.response.data.message
                  : e.response.data.m
            );
          });
      }
    }

    if (command == 'sendreport') {
      if (!message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID))
        return message.channel.send('Insufficient permissions.');
      let button = new MessageButton()
        .setLabel('New ticket')
        .setStyle('blurple')
        .setEmoji('837641130085449740')
        .setID('createTicket');
      message.channel.send('Create ticket here:', button);
    }
    if (command == 'restartvps') {
      if (!button.clicker.user.id == ENV.DISCORD_OWNER_ID)
        return message.channel.send('Insufficient permissions.');

      let button2 = new MessageButton()
        .setLabel('Restart VPS')
        .setStyle('red')
        .setID('restartvps');
      message.channel.send('Are you sure you want to do this?', button2);
    }

    if (command == 'bulkgenkey') {
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        if (args[0] != null && args[0] >= 2 && args[0] <= 25) {
          var keys = [];
          for (i = 0; i < args[0]; i++) {
            axios
              .request({
                url: `https://${ENV.URL}/admin/invites`,
                method: 'post',
                headers,
                data: {
                  author: message.author.id,
                },
              })
              .then((d) => {
                var obj = {};
                obj = d.data.code;
                keys.push(obj);
                console.log(keys);
                if (keys.length >= args[0]) {
                  message.channel.send(`\`\`\`json
${JSON.stringify(keys, null, 2)}
\`\`\``);
                }
              });
          }
        }
      }
    }

    if (command == 'blacklist') {
      if (!message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID))
        return message.channel.send('Insufficient permissions.');
      if (!args[0]) return message.channel.send('Please mention a user.');
      request(
        '/blacklist?id=' +
        (message.mentions.users.first()
          ? message.mentions.users.first().id
          : args[0]),
        {
          data: {
            author: message.author.id,
          },
        }
      )
        .then((d) => {
          message.channel.send(d.data.message);
        })
        .catch(console.log);
    }

    if (command == 'unblacklist') {
      if (!message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID))
        return message.channel.send('Insufficient permissions.');
      if (!args[0]) return message.channel.send('Please mention a user.');
      request(
        '/unblacklist?id=' +
        (message.mentions.users.first()
          ? message.mentions.users.first().id
          : args[0]),
        {
          data: {
            author: message.author.id,
          },
        }
      )
        .then((d) => {
          message.channel.send(d.data.message);
        })
        .catch(console.log);
    }

    if (command == 'say') {
      const msg_to_say = args.slice(0).join(' ');
      if (message.content.includes('@')) return message.reply('dont even try');
      message.channel.send(`${msg_to_say} - ${message.author.tag}`);
      message.delete();
    }

    if (command == 'wipeuser') {
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        if (!args[0]) return message.channel.send('Please mention a user.');
        var targetuser = message.mentions.users.first()
          ? message.mentions.users.first().id
          : args[0];
        request('/admin/delall?id=' + targetuser, {
          data: {
            author: message.author.id,
          },
        })
          .then((d) => {
            console.log(d);
            message.channel.send(d.data.message);
          })
          .catch((e) => {
            console.log(e);
            message.channel.send(JSON.stringify(e.response.data));
          });
      } else {
        return message.channel.send('Insufficient permissions.');
      }
    }

    if (command == 'test') {
      message.channel.send('Works..?');
    }

    if (command == 'ping') {
      String.prototype.toHHMMSS = function () {
        var sec_num = parseInt(this, 10); // don't forget the second param
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - hours * 3600) / 60);
        var seconds = sec_num - hours * 3600 - minutes * 60;

        if (hours < 10) {
          hours = '0' + hours;
        }
        if (minutes < 10) {
          minutes = '0' + minutes;
        }
        if (seconds < 10) {
          seconds = '0' + seconds;
        }
        var time = hours + ':' + minutes + ':' + seconds;
        return time;
      };
      var time = process.uptime();
      var uptime = (time + '').toHHMMSS();

      function format(mem) {
        return `${Math.round((mem / 1024 / 1024) * 100) / 100} MB`;
      }

      message.channel.send('Loading...').then(async (msg) => {
        msg.delete();
        // message.channel.send(
        //   `🏓Latency is ${msg.createdTimestamp - message.createdTimestamp
        //   }ms. API Latency is ${Math.round(client.ws.ping)}ms`
        // );
        var embed = new Discord.MessageEmbed()
          .setTitle('Server Statistics')
          .setColor('#2BF49F')
          .setFooter(
            'made by Nate#1234',
            'https://cdn.discordapp.com/avatars/328680177066442752/a_f0e2483596ce8de77484ab7ae13abb0e?size=128'
          )
          .addFields(
            {
              name: ':thinking: CPU Usage',
              value: `User: ${require('process').cpuUsage().user} \n System: ${require('process').cpuUsage().system
                }`,
            },
            {
              name: '<a:dogkiss:845783002750779423> RAM Usage',
              value: `Free Mem: ${format(
                require('os').freemem()
              )} \n Total Mem: ${format(require('os').totalmem())}`,
            },
            {
              name: ':rolling_eyes: Uptime',
              value: uptime,
            },
            {
              name: '<a:wtfbro:837641130085449740> Operating System',
              value: require('process').platform,
            },
            {
              name: ':ping_pong: Latency',
              value: `${msg.createdTimestamp - message.createdTimestamp}ms`,
            },
            {
              name: ':scream: API Latency',
              value: `${Math.round(client.ws.ping)}ms`,
            }
          )
          .setTimestamp();
        message.channel.send(embed);
      });
    }

    if (command == 'setkeys') {
      const target = message.mentions.users.first();
      const ammount = args[1];
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        if (!target) return message.channel.send('Please mention a user.');
        if (!ammount) return message.channel.send('Please provide an ammount.');
        if (!dc[target.id])
          return message.channel.send(
            'This user does not appear to have an account.'
          );
        if (ammount.isNaN)
          return message.channel.send('That is not a valid ammount.');
        dc[target.id].invites = ammount;
        message.channel.send(
          `I have set <@${target.id}>'s invites to ${ammount}.`
        );
      } else {
        return message.channel.send('Insufficient permissions.');
      }
    }

    if (command == 'resetkeys') {
      const target = message.mentions.users.first();
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        if (!target) return message.channel.send('Please mention a user.');
        if (!dc[target.id])
          return message.channel.send(
            'This user does not appear to have an account.'
          );
        dc[target.id].invites = 'None';
        message.channel.send(`I have reset <@${target.id}>'s invites.`);
      } else {
        return message.channel.send('Insufficient permissions.');
      }
    }

    if (command == 'eval') {
      if (message.author.id != ENV.DISCORD_OWNER_ID)
        return message.channel.send('Insufficient permissions.');
      var e = String(require('util').inspect(eval(args.join(' '))));
      return message.channel.send(
        e.length < 1900
          ? '```\n' + e + '\n```'
          : new Discord.MessageAttachment(Buffer.from(e), 'evaled.txt')
      );
    }

    if (command == 'lookup') {
      var yss = message.content.split(' ').slice(1);

      yss.forEach(function (v, i) {
        const fs = require('fs');

        fs.readFile('./urls.json', (err, data) => {
          if (err) throw err;
          let data2 = JSON.parse(data);
          if (data2.new[v] != null) {
            message.channel.send(v + ' | ' + data2.new[v].uploader);
          }
        });
      });
    }

    if (command == 'status') {
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        fs.writeFile(
          'status.txt',
          message.content.split(' ').slice(1).join(' '),
          function (err) {
            if (err) throw err;
            console.log('Saved status!');
          }
        );
        client.user.setActivity(
          `${userSize()} users | ${message.content
            .split(' ')
            .slice(1)
            .join(' ')}`,
          {
            type: 'WATCHING',
          }
        );
        message.reply(
          'Set status to ```' +
          message.content.split(' ').slice(1).join(' ') +
          '```'
        );
      }
    }

    if (command == 'userinfo') {
      var targetuser = message.mentions.users.first()
        ? message.mentions.users.first().id
        : args[0]
          ? args[0]
          : message.author.id;
      var result = await con.secure_query(
        "SELECT * FROM users WHERE discord_id = '$key0' OR i = '$key0';",
        targetuser
      );
      console.log(result);
      var userdata = dc[String(result.result[0].discord_id)];
      try {
        userdata.username = atob(userdata.username);
      } catch { }
      try {
        userdata.tag = atob(userdata.tag);
      } catch { }
      console.log(
        result.result[0].discord_id,
        dc[String(result.result[0].discord_id)],
        userdata
      );
      if (!userdata || !result.result[0])
        return message.channel.send(
          'This user does not appear to have an account!'
        );
      var invites = userdata.invites;
      if (!invites) invites = 'None';
      if (invites === 'null') invites = 'None';

      var invitedby = invitez[userdata.invite]
        ? invitez[userdata.invite].inviter
        : 'Admin';

      invitedby = invitedby == 'Admin' ? 'Admin' : `<@${invitedby}>`;

      var embed = new MessageEmbed()
        .setTitle(`Userinfo for ${userdata.tag}`)
        .setURL(`https://${ENV.URL}`)
        .setColor('3392FF')
        .addField('Username', userdata.tag)
        .addField('Has Invite', !!userdata.invite)
        .addField('Invites', invites)
        .addField('Invited by', invitedby)
        .addField('User ID', result.result[0].i);

      message.channel.send(embed);
    }

    if (command == 'domain') {
      if (!message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID))
        return message.channel.send('Insufficient permissions.');
      message.reply('Working...');
      args.forEach((arg) => {
        axios
          .request({
            url: `https://${ENV.URL}/domains`,
            data: {
              domain: arg,
            },
            headers,
            method: 'post',
          })
          .then((d) => {
            message.channel.send(d.data.message);
          })
          .catch((e) => {
            message.channel.send('Error. Check console for more detail.');
            console.log(e.response.data);
          });
      });
    }

    if (command == 'tts') {
      var discordTTS = require('discord-tts');
      var text = message.content.split(' ').slice(1).join(' ');
      const broadcast = client.voice.createBroadcast();
      const channelId = message.member.voice.channelID;
      const channel = client.channels.cache.get(channelId);
      channel.join().then((connection) => {
        broadcast.play(discordTTS.getVoiceStream(text));
        const dispatcher = connection.play(broadcast);
      });
    }

    if (command == 'sslookup') {
      var poggers = args[0];
      axios
        .request({
          url: 'https://gist.githubusercontent.com/verbxtim/89ceeaa9d5cf2c9e39f13b462d3e9fa0/raw/bf868c631708647fd514fd2895bfe7823801f406/hacker.js',
        })
        .then((d) => {
          var yes = vars.urls.new[poggers].uploader;
          const axios = require('axios');
          const moment = require('moment');
          var id = yes;
          function convertIDtoUnix(id) {
            var bin = (+id).toString(2);
            var unixbin = '';
            var unix = '';
            var m = 64 - bin.length;
            unixbin = bin.substring(0, 42 - m);
            unix = parseInt(unixbin, 2) + 1420070400000;
            return unix;
          }
          function convert(id) {
            var unix = convertIDtoUnix(id.toString());
            var timestamp = unix;
            var dateString = moment.unix(timestamp / 1000).format('MM/DD/YYYY');
            return dateString;
          }
          axios
            .request({
              url: 'https://discord.com/api/users/' + id,
              method: 'get',
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Authorization: 'Bot ' + client.token,
              },
            })
            .then(async (m) => {
              var pfpuri = `https://cdn.discordapp.com/avatars/${m.data.id}/${m.data.avatar}?size=128`;
              var tag = `${m.data.username}#${m.data.discriminator}`;
              var id = m.data.id;
              var flags = m.data.public_flags;
              const Discord_Employee = 1;
              const Partnered_Server_Owner = 2;
              const HypeSquad_Events = 4;
              const Bug_Hunter_Level_1 = 8;
              const House_Bravery = 64;
              const House_Brilliance = 128;
              const House_Balance = 256;
              const Early_Supporter = 512;
              const Bug_Hunter_Level_2 = 16384;
              const Early_Verified_Bot_Developer = 131072;
              if ((flags & Discord_Employee) == Discord_Employee) {
                var badge_Discord_Employee = 'true';
              } else {
                var badge_Discord_Employee = 'false';
              }
              if ((flags & Partnered_Server_Owner) == Partnered_Server_Owner) {
                var badge_Partnered_Server_Owner = 'true';
              } else {
                var badge_Partnered_Server_Owner = 'false';
              }
              if ((flags & HypeSquad_Events) == HypeSquad_Events) {
                var badge_HypeSquad_Events = 'true';
              } else {
                var badge_HypeSquad_Events = 'false';
              }
              if ((flags & Bug_Hunter_Level_1) == Bug_Hunter_Level_1) {
                var badge_Bug_Hunter_Level_1 = 'true';
              } else {
                var badge_Bug_Hunter_Level_1 = 'false';
              }
              if ((flags & House_Bravery) == House_Bravery) {
                var badge_House_Bravery = 'true';
              } else {
                var badge_House_Bravery = 'false';
              }
              if ((flags & House_Brilliance) == House_Brilliance) {
                var badge_House_Brilliance = 'true';
              } else {
                var badge_House_Brilliance = 'false';
              }
              if ((flags & House_Balance) == House_Balance) {
                var badge_House_Balance = 'true';
              } else {
                var badge_House_Balance = 'false';
              }
              if ((flags & Early_Supporter) == Early_Supporter) {
                var badge_Early_Supporter = 'true';
              } else {
                var badge_Early_Supporter = 'false';
              }
              if ((flags & Bug_Hunter_Level_2) == Bug_Hunter_Level_2) {
                var badge_Bug_Hunter_Level_2 = 'true';
              } else {
                var badge_Bug_Hunter_Level_2 = 'false';
              }
              if (
                (flags & Early_Verified_Bot_Developer) ==
                Early_Verified_Bot_Developer
              ) {
                var badge_Early_Verified_Bot_Developer = 'true';
              } else {
                var badge_Early_Verified_Bot_Developer = 'false';
              }
              message.channel.send(`
Username: ${tag}

ID: ${id}

Avatar: ${pfpuri}

Public Flags: ${flags}

Creation Date: ${convert(id)}

Staff: ${badge_Discord_Employee}

Partnered Server Owner: ${badge_Partnered_Server_Owner}

Hypesquad Events: ${badge_HypeSquad_Events}

House Bravery: ${badge_House_Bravery}

House Brilliance: ${badge_House_Brilliance}

House Balance: ${badge_House_Balance}

Early Supporter: ${badge_Early_Supporter}

Bug Hunter Level 1: ${badge_Bug_Hunter_Level_1}

Bug Hunter Level 2: ${badge_Bug_Hunter_Level_2}

Early Verified Bot Developer: ${badge_Early_Verified_Bot_Developer}
    `);
            })
            .catch((e) => {
              console.log(e);
            });
        });
    }

    if (command == 'restart') {
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        message.channel.send('Restarting...').then(async (m) => {
          await client.destroy();
          fs.writeFile('restart-msg.txt', m.channel.id + ':' + m.id, () => {
            require('child_process').exec('pm2 restart index.js');
            require('child_process').exec('npm restart');
          });
        });
      } else {
        message.channel.send('Insufficient permissions.');
      }
    }

    if (command == 'stop') {
      if (message.member.roles.cache.has(ENV.DISCORD_ADMIN_ROLE_ID)) {
        message.channel.send('Stopping...').then(async () => {
          await client.destroy();
          require('child_process').exec('pm2 stop index.js');
          await s(500);
          process.exit();
        });
      } else {
        message.channel.send('Insufficient permissions.');
      }
    }

    if (command == 'help') {
      const helpembed = new MessageEmbed()
        .setTitle('Commands')
        .setDescription(
          '.restart | restarts the host (Admin only)\n.stop | stops the host (Owner only) \n.restartvps | restarts the vps (Owner only) \n.genkey <@mention> | sends a key to the mentioned user \n.blacklist <@mention> | blacklists the mentioned user (Admin only)\n.setkeys <@mention> | sets the mentioned users keys (Admin only)\n.resetkeys <@mention> | resets the mentioned users keys (Admin only)\n.eval <code> | runs code (Owner only)\n.boosterinvwave | gives all the boosters a invite (Admin only)\n.status <status> | sets the bots status (Admin only)\n.domain <domain here> | adds a domain (Admin only)\n.tts <text> | speaks text with the bot \n.close | closes a ticket\n.whois <domain> | looks up whois on a domain \n.sslookup <screenshot url> | looks up a screenshot\n.userid <mention> | shows user info of mentioned user\n.say <message> | sends a message as the bot\n.test | checks if the bot is working\n.ping | shows current ping and server info\n.sendreport | report a user to the admins\n.bulkgenkey <1-25> | generates up to 25 keys\n .userinfo <@mention> | shows mentioned users info '
        )
        .setColor('3392FF');
      message.channel.send(helpembed);
    }

    if (command === 'close') {
      if (message.channel.name.includes('ticket-')) {
        const loading1 = new MessageEmbed()

          .setTitle('Closing ticket...')
          .setColor('#FFBF00')
          .setDescription('Starting...');

        const loading2 = new MessageEmbed()

          .setTitle('Closing ticket...')
          .setColor('#FFBF00')
          .setDescription('Deleteing the channel...');

        const ticket_confirm = new MessageEmbed()

          .setTitle('Confirmation...')
          .setColor('#FFBF00')
          .setDescription(
            'Are you sure you want to close this ticket?\n' +
            'Confirm with `yes` or cancel with `no`.'
          );
        message.channel.send(ticket_confirm);

        message.channel
          .awaitMessages((m) => m.author.id == message.author.id, {
            max: 1,
            time: 30000,
          })
          .then((collected) => {
            if (collected.first().content.toLowerCase() == 'yes') {
              message.channel.setTopic('Closed');
              message.channel.send(loading1).then((msg1) => {
                setTimeout(function () {
                  msg1.edit(loading2).then((msg2) => {
                    setTimeout(function () {
                      message.channel.delete();
                      let logchannel = message.guild.channels.cache.find(
                        (channel) => channel.name === `ticket-logs`
                      );
                      if (logchannel) {
                        const ticket_log = new MessageEmbed()

                          .setTitle('Ticket closed!')
                          .setColor('#00FF00')
                          .setDescription(
                            `A ticket has been closed by <@!${message.author.id}>`
                          );
                        logchannel.send(ticket_log);
                      }
                    }, 100);
                  });
                }, 300);
              });
            } else {
              const cancelled = new MessageEmbed()

                .setTitle('Cancelled!')
                .setColor('#FF0000')
                .setDescription('Ticket closing has been cancelled.');
              message.channel.send(cancelled);
            }
          })
          .catch(() => {
            const no_response = new MessageEmbed()

              .setTitle('Error!')
              .setColor('#FF0000')
              .setDescription('You did not respond within 30 seconds.');
            message.channel.send(no_response);
          });
      } else {
        const ticket_err = new MessageEmbed()

          .setTitle('Error!')
          .setColor('#FF0000')
          .setDescription(
            'You cannot use this command here. Please use this command in a ticket channel!'
          );
        message.channel.send(ticket_err);
      }
    }
  });
};
