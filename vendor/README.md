# vendor/: the libraries the app uses, kept here

Since v3.9 the app loads these from this folder, not from a CDN, so an outage or a removed version at cdnjs can't break it. They are the exact files cdnjs serves, unchanged, checked against cdnjs's published SHA-512 hashes when they were copied in (Nov 7, 2026). Google's sign-in script (`accounts.google.com/gsi/client`) still loads from Google; it has to.

| File | Copied from | SHA-512 |
|---|---|---|
| `papaparse-5.4.1.min.js` | https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js | `sha512-dfX5uYVXzyU8+KHqj8bjo7UkOdg18PaOtpa48djpNbZHwExddghZ+ZmzWT06R5v6NSk3ZUfsH6FNEDepLx9hPQ==` |
| `jszip-3.10.1.min.js` | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js | `sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==` |
| `chart-4.4.1.umd.min.js` | https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js | `sha512-CQBWl4fJHWbryGE+Pc7UAxWMUMNMWzWxF4SQo9CgkJIN1kx6djDQZjh3Y8SZ1d+6I+1zze6Z7kHXO7q3UyZAWw==` |
| `pdf-3.11.174.min.js` | https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js | `sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ==` |
| `pdf.worker-3.11.174.min.js` | https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js | `sha512-BbrZ76UNZq5BhH7LL7pn9A4TKQpQeNCHOo65/akfelcIBbcVvYWOFQKPXIrykE3qZxYjmDX573oa4Ywsc7rpTw==` |

**To update one:** download the new version from cdnjs into this folder with its version in the name, check its hash against `https://api.cdnjs.com/libraries/<name>/<version>?fields=sri`, change the `<script>` tag in `index.html` (and, for pdf.js, `workerSrc` in `importers.js`; for PapaParse, `tests.html`), delete the old file, and update this table. The screenshot check shows if a new Chart.js draws differently.

Licenses: PapaParse (MIT), JSZip (MIT or GPLv3), Chart.js (MIT), pdf.js (Apache 2.0). Each file keeps its own license header.
