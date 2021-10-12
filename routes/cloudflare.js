module.exports = function (vars) {
  const {
    ENV,
    axios,
    domains,
    app,
    checkAdminAuth,
    s,
    express,
    fs
  } = vars;
  const api_url = 'https://api.cloudflare.com/client/v4';

  var zoneid

  const headers = {
    // 'X-Auth-Key': ENV.CF_API_KEY,
    'Authorization': ENV.CF_API_KEY.includes('Bearer ') ? ENV.CF_API_KEY : 'Bearer ' + ENV.CF_API_KEY,
    'X-Auth-Email': ENV.CF_EMAIL
  };

  async function request(url, d) {
    d = d ? d : {}
    var head = d.headers ? d.headers : {}
    var method = d.method ? d.method : 'get'
    var data = d.data ? d.data : {}

    return axios.request({
      url: api_url + url,
      method: method ? method : 'get',
      headers: head != null ? {
        ...headers,
        ...head
      } : headers,
      data: data
    });
  }

  app.post('/domains', [express.json(), checkAdminAuth], async (req, rees) => {
try {
    request('/zones', {
      method: 'POST',
      data: {
        name: req.body.domain,
        account: {
          id: ENV.CF_ID
        },
        jump_start: false,
        type: "full"
      }
    }).then(async res => {
      const zone = res.data.result
      var sent = false
      console.log(res.data)

        if (!domains.includes(zone.name)) domains.push(zone.name)
        console.log(zone.name)
        fs.writeFileSync('./domains.json', JSON.stringify(domains, null, 2))

      request('/zones/' + zone.id + '/dns_records/', {
        method: 'post',
        data: {
          type: "CNAME",
          name: `*`,
          content: zone.name,
          ttl: 1,
          proxied: false
        }
      }).then(() => {
        request('/zones/' + zone.id + '/dns_records/', {
          method: 'post',
          data: {
            type: "CNAME",
            name: `@`,
            content: ENV.URL,
            ttl: 1,
            proxied: false
          }
        }).catch(e => {
          console.log(e.response.data.errors, e.response.data)
          rees.status(500).send('Error')
        }).then(() => {
          rees.status(200).json({ message: 'Done!' })
        })
      }).catch(e => {
          console.log(e.response.data.errors, e.response.data)
          rees.status(500).send('Error')
        })
}).catch(e => {
          console.log(e.response.data.errors, e.response.data)
          rees.status(500).send('Error')
        })
} catch (e) { console.log(e)}
  })
};
