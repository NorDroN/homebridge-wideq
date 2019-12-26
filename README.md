# homebridge-wideq
A [Homebridge][] plugin for controlling/monitoring LG devices via their SmartThinQ platform, based on [WideQ][].

[homebridge]: https://github.com/nfarina/homebridge
[wideq]: https://github.com/sampsyo/wideq

Here's how to use this:

1. Install the [WideQ][]:

       $ pip3 install --upgrade wideq

2. Install the homebridge-wideq plugin:

       $ npm install -g homebridge-wideq

3. Get refresh token:

   Authenticate with the SmartThinQ service to get a refresh token by running the WideQ example script. (Eventually, I would like to add a feature to the Homebridge plugin that can let you log in through a UI, but I haven't gotten there yet.) Clone [WideQ][] repository and run example.py:

       $ git clone https://github.com/sampsyo/wideq.git
       $ cd wideq
       $ python3 example.py -c US -l en-US

   For the `-c` and `-l` parameters, use your country and language code: SmartThinQ accounts are associated with a specific locale, so be sure to use the country you originally created your account with.
   The script will ask you to open a browser, log in, and then paste the URL you're redirected to. It will then write a JSON file called `wideq_state.json`.

   Look inside this file for a key called `"refresh_token"` and copy the value.

4. Add the plugin to your config.json:

        {
            "platform": "WideQ",
            "refresh_token": [YOUR_TOKEN_HERE],
            "country": "US",
            "language": "en-US",
            "debug": false,
            "interval": 10
        }

   Use your refresh token and country & language codes. If region and language are not provided, then 'US' and 'en-US' are default.
