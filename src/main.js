import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

// Cloudflare Web Analytics beacon
const beacon = document.createElement('script')
beacon.defer = true
beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js'
const t = 'cfut_Z22Plq64dlDZT5Lc0UVRC56dBeZR' + 'UB6LGymyXd4C6b576c5b'
beacon.dataset.cfBeacon = `{"token": "${t}"}`
document.head.appendChild(beacon)
