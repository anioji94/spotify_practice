// Call and instantiate express
require('dotenv').config();
const axios = require('axios');
const querystring = require('querystring');
const express = require('express');
const { send } = require('process');
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = length => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text;
}

const stateKey = 'spotify_auth_state';

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.get('/login', (req, res) => {
  // res.send('login to spotify')
  const state = generateRandomString(16)
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email';

  const queryParams = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: scope,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
})

app.get('/callback', (req, res) => {
  const code = req.query.code || null;

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  })
    .then(response => {
      if (response.status === 200) {
        const { access_token, refresh_token, expires_in } = response.data;

        const queryParams = querystring.stringify({
          access_token,
          refresh_token,
          expires_in,
        });

        res.redirect(`http://localhost:3000/?${queryParams}`);

      } else {
        res.redirect(`/?${querystring.stringify({ error: 'invalid_token' })}`);
      }
    })
    .catch(error => {
      res.send(error);
    });
});

app.get('/refresh_token', (req, res) => {
  const {refresh_token} = req.query;

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },  
  })
    .then(response => {
      res.send(response.data);
    })
    .catch(error => {
      res.send(error);
    });
})
// axios.get('http://localhost:8888/refresh_token?')
// app.get('/awesome-generator', (req, res) => {
//   const { name, isAwesome } = req.query;
//   res.send(`${name} is ${JSON.parse(isAwesome) ? 'really': 'not'} awesome.`)
// })

// Above code uses a GET method to get the '/' route
// The response sends back a string 'Hello World'

// Port information
const port = 8888

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port} my dude`)
})

/*
Use express with the following route definition:

  app.METHOD(PATH, HANDLER)

  - app is an Express instance
  - METHOD is an HTTP request method in lowercase (like get or post)
  - PATH is a URL path on the server
  - HANDLER is a callback function that is run every time a user hits the specific url
    This callback function takes two arguments req(Request) and res(Response)
*/
