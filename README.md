# Filter Batphone rotation from VictorOps personal calendar (ICS)

## Usage
Feel free to use the worker I've set up already (as long as they do not reach the free tier limits ;-))
* `https://victorops.pandaschinken.workers.dev/wikimedia/<USERNAME>/<TOKEN>.ics`

## Setup
To set up your own worker, follow the [Cloudflare Workers: Get started guide](https://developers.cloudflare.com/workers/get-started/guide) until you have a logged in [wrangler](https://developers.cloudflare.com/workers/tooling/wrangler) config.

* Run `wrangler whoami` to get your _Account ID_
* Copy `wrangler.toml.tmpl` to `wrangler.toml`
* Add your _Account ID_ to `wrangler.toml`

After that you can publish the code by calling:
```bash
wrangler publish
```
