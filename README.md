[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)


Create a `development.json` file with your Telegram credentials in:
```json
{
  "telegram": {
    "apiId": "get this from my.telegram.org",
    "apiHash": "get this from my.telegram.org",
    "botId": "optionally get this from t.me/botfather"
  }
}
```

then install and run:

```console
$ npm install
$ npm start
```

To allow the bot to view messages in groups, you'll need to tell BotFather to disable privacy mode.
