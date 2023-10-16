const ICAL = require('ical.js')

async function getCalendarUrl(org, username, token) {
  return 'https://portal.victorops.com/api/v1/org/' + org + '/user/' + username + '/calendar/' + token
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
  const params = url.pathname.split('/')
  if (params.length != 4 || !params[3].endsWith('.ics')) {
    const statusText = 'Badly formatted request, path must be /org/username/token.ics'
    return new Response(statusText, {
      status: 400,
      statusText: statusText
    })
  }

  const org = params[1]
  const user = params[2]
  const token = params[3]
  const calendarUrl = await getCalendarUrl(org, user, token)
  try {
    const response = await fetch(calendarUrl)
    if (response.status != 200) {
      // Return whatever status songkick returned
      return new Response('Error from VictorOps', { status: response.status })
    }
    var calendarText = await response.text()
    var cacheControl = response.headers.get('cache-control')
  } catch (exception) {
    return new Response('', { status: 500, statusText: 'Error fetching calendar from VictorOps' })
  }

  const newCalendar = await buildCalendar(calendarText, user)
  const headers = {
    'content-type': 'text/calendar; charset=UTF-8',
    'cache-control': cacheControl ? cacheControl : 'no-store, no-cache, must-revalidate'
  }
  return new Response(newCalendar, {
    status: 200,
    headers: headers
  })
}

async function buildCalendar(text, user) {
  const jcalData = ICAL.parse(text)
  const vcomp = new ICAL.Component(jcalData)

  // create a new calendar as output
  const newvcal = new ICAL.Component(['vcalendar', [], []])

  // copy all properties
  Array.from(vcomp.getAllProperties()).forEach(function (property) {
    newvcal.addProperty(property)
  })
  // ensure prodid and calname are updated
  newvcal.updatePropertyWithValue('prodid', '-//Improved VictorOps Calendar//EN')
  newvcal.updatePropertyWithValue('x-wr-calname', 'SRE:OnCall for ' + user)

  // Filter only vevent's, copy all other subcomponents as they are
  Array.from(vcomp.getAllSubcomponents()).forEach(function (subComp) {
    if (subComp.name === 'vevent') {
      const summary = subComp.getFirstPropertyValue('summary')
      if (summary.includes('Batphone') || summary.includes('(Escalation)')) {
        // Don't include events from Batphone rotation and Escalation (leading to duplicates)
        return
      }
      subComp.updatePropertyWithValue('summary', 'OnCall -' + summary.split('-')[1])
    }
    newvcal.addSubcomponent(subComp)
  })

  return newvcal.toString()
}

addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request)
  )
})