import Raven from 'raven-js'
import React from 'react'
import ReactDOM from 'react-dom'
import { isProd } from '../common/env'
import App from './app'
import i18n from './i18n'

if (isProd) {
  Raven.config('https://d2ddb64170f34a2ca621de47235480bc@sentry.io/1196839').install()
}

document.title = i18n('optionsTitle')

ReactDOM.render(
  <App />,
  document.querySelector('#app')
)
