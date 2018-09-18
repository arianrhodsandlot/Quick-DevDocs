import '@babel/polyfill'
import browser from 'webextension-polyfill'
import Raven from 'raven-js'
import Docs from './docs'

async function getDocNames () {
  const defaultCategories = ['css', 'dom', 'dom_events', 'html', 'http', 'javascript']
  const cookie = await browser.cookies.get({url: 'http://devdocs.io', name: 'docs'})
  const categories = cookie && cookie.value ? cookie.value.split('/') : defaultCategories
  return categories
}

async function addMessageListener () {
  const docs = new Docs(await getDocNames())

  async function searchEntry ({query, scope}) {
    if (!query && !scope) return null
    if (!scope) return await docs.searchEntries(query)
    const doc = await docs.attemptToMatchOneDoc(scope)
    if (!query) {
      return doc.entries.slice(0, 50)
    }
    return await docs.searchEntriesInDoc(query, doc)
  }

  async function matchOneDoc ({scope}) {
    const doc = await docs.attemptToMatchOneDoc(scope)
    return doc
  }

  browser.cookies.onChanged.addListener(({cookie: {domain, name}}) => {
    if (!(['devdocs.io', '.devdocs.io'].includes(domain))) return
    if (name !== 'docs') return
    docs.debouncedReload()
  })

  browser.runtime.onMessage.addListener(async function ({action, payload}) {
    switch (action) {
      case 'search-entry':
        const entries = await searchEntry(payload)
        return { status: 'success', content: entries }
      case 'match-one-doc':
        return await matchOneDoc(payload)
      default:
        return null
    }
  })
}

addMessageListener()

if (!localStorage.install_time || !localStorage.version) {
  browser.tabs.create({
    url: 'dist/options.html#welcome'
  })
}

Object.assign(localStorage, {
  version: '0.1.9',
  install_time: Date.now(),
  theme: 'light',
  width: 600,
  height: 600
})

if (process.env.NODE_ENV === 'production') {
  Raven.config('https://d2ddb64170f34a2ca621de47235480bc@sentry.io/1196839').install()
}
