const ICAL = require('ical.js')

// String that is used to identify "Going to" events
const goingToDescription = 'You’re going'

async function getSongkickCalendarUrl(username) {
  return 'https://www.songkick.com/users/' + username + '/calendars.ics?filter=attendance'
}

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  // Only GET requests are supported
  if (request.method !== 'GET') {
    const statusText = 'Ony GET requests supported'
    return new Response(statusText, {
      status: 400,
      statusText: statusText
    })
  }

  const url = new URL(request.url)
  let params = url.pathname.split('/')
  if (params.length != 3 || !(params[2] === 'going.ics' || params[2] === 'interested.ics')) {
    const statusText = 'Badly formatted request, must be /username/[going|interested].ics'
    return new Response(statusText, {
      status: 400,
      statusText: statusText
    })
  }

  const songkickUser = params[1]
  const calendarType = params[2]
  const calendarUrl = await getSongkickCalendarUrl(songkickUser)
  try {
    const songkickResponse = await fetch(calendarUrl)
    if (songkickResponse.status != 200) {
      // Return whatever status songkick returned
      return new Response('Error from Songkick', { status: songkickResponse.status })
    }
    var calendarText = await songkickResponse.text()
    // Songkick returns DTSTART/DTEND with type DATE but does not say so.
    // ical.js then fails to parse date-time from those fields, creating broken iCal
    calendarText = calendarText.replace(/^(DT(?:START|END)):(\d{8})$/gm, '$1;VALUE=DATE:$2')

    var songkickCacheControl = songkickResponse.headers.get('cache-control')
  } catch (exception) {
    return new Response('', { status: 500, statusText: 'Error fetching calendar from Songkick' })
  }

  const newCalendar = await buildCalendar(calendarText, calendarType, songkickUser)
  const headers = {
    'content-type': 'text/calendar; charset=UTF-8',
    'cache-control': songkickCacheControl ? songkickCacheControl : 'no-store, no-cache, must-revalidate'
  }
  return new Response(newCalendar, {
    status: 200,
    headers: headers
  })
}

async function buildCalendar(text, calendarType, songkickUser) {
  const jcalData = ICAL.parse(text)
  const vcomp = new ICAL.Component(jcalData)
  const vevents = vcomp.getAllSubcomponents('vevent')
  const publishedTTL = vcomp.getFirstPropertyValue('x-published-ttl')

  // create a new calendar as output
  const newvcal = new ICAL.Component(['vcalendar', [], []])
  newvcal.updatePropertyWithValue('prodid', '-//Improved Songkick Calendar//iCal 1.0/EN')
  newvcal.updatePropertyWithValue('x-wr-calname', 'Songkick: Events ' + songkickUser + ' goes to')
  if (publishedTTL) {
    newvcal.updatePropertyWithValue('x-published-ttl', publishedTTL)
  }

  vevents.forEach(filterType)
  function filterType(vevent) {
    const description = vevent.getFirstPropertyValue('description')
    //check if the event description contains the identifier
    const isGoingToEvent = description.startsWith(goingToDescription)
    if ((calendarType === 'interested.ics' && !isGoingToEvent) || (calendarType === 'going.ics' && isGoingToEvent)) {
      // Copy the event to the output calendar
      newvcal.addSubcomponent(vevent)
    }
  }
  return newvcal.toString()
}

addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request)
  )
})