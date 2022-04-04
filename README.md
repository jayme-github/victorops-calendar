# A better iCal for Songkick

Songkick does export your concert plans as iCal: https://www.songkick.com/users/USERNAME/calendars.ics?filter=attendance
Unfortunately that calendar does contain events you've marked as "Going" as well as the ones you've marked "Interesting. This Cloudflare Worker script does filter your calendar to return just one type of events. So you can subscribe to just one or to both but have different calendar colors for each of them.

## Usage
Feel free to use the worker I've set up already (as long as they do not reach the free tier limits ;-))
* https://songkick.pandaschinken.workers.dev/USERNAME/going.ics
* https://songkick.pandaschinken.workers.dev/USERNAME/interested.ics

## Setup
To set up your own worker, follow the [Cloudflare Workers: Get started guide](https://developers.cloudflare.com/workers/get-started/guide) until you have a logged in [wrangler](https://developers.cloudflare.com/workers/tooling/wrangler) config.

* Run `wrangler whoami` to get your _Account ID_
* Copy `wrangler.toml.tmpl` to `wrangler.toml`
* Add your _Account ID_ to `wrangler.toml`

After that you can publish the code by calling:
```bash
wrangler publish
```