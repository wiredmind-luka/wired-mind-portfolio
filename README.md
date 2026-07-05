# wired-mind · Portfolio-Website

Statische Portfolio-Website ohne Backend, Datenbank, Cookies, Tracking oder
externe Abhängigkeiten. Nur HTML, CSS und minimales JavaScript mit
Systemschriften.

## Projektstruktur

```
portfolio/
├── index.html          # Onepager (Hero, Über mich, Skills, Projekte, Werdegang, Kontakt)
├── en/index.html       # Englische Version des Onepagers
├── impressum.html      # Impressum (Platzhalter!)
├── datenschutz.html    # Datenschutzerklärung (Platzhalter!)
├── 404.html            # Fehlerseite im Terminal-Stil (Nginx: error_page, siehe unten)
├── favicon.ico         # Fallback-Favicon (SVG-Variante: assets/favicon.svg)
├── robots.txt          # Crawler erlaubt, Verweis auf sitemap.xml
├── sitemap.xml         # Beide index-Seiten mit hreflang
├── .well-known/
│   └── security.txt    # RFC 9116 (Expires jährlich erneuern!)
├── assets/
│   ├── css/style.css   # Komplettes Styling (Dark-Infrastructure-Theme)
│   ├── js/main.js      # Typing-Effekt, Mobile-Nav, Scroll-Spy, Jahreszahl
│   └── img/og-image.png# Social-Media-Vorschaubild (1200×630)
└── README.md
```

## Lokal testen

Variante 1 – einfach im Browser öffnen: `index.html` doppelklicken.
Funktioniert für diese Seite vollständig, da keine Server-Features nötig sind.

Variante 2 – mit lokalem Webserver (näher am echten Hosting):

```bash
cd portfolio
python3 -m http.server 8080
# dann im Browser: http://localhost:8080
```

## Deployment auf dem Debian-LXC (Nginx, aktuelles Setup)

Die einfachste Variante mit dem bestehenden Nginx-Default:

```bash
# Auf der LXC: alten Platzhalter ersetzen
rm /var/www/html/index.html
# Dateien z. B. per Git oder scp nach /var/www/html/ kopieren
```

Sauberere Variante mit eigenem Verzeichnis `/var/www/portfolio`:

```bash
mkdir -p /var/www/portfolio
# Dateien dorthin kopieren/klonen, dann Nginx-Site anpassen (siehe unten)
```

### Beispiel-Konfiguration: Nginx

`/etc/nginx/sites-available/portfolio`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name wired-mind.net www.wired-mind.net;

    root /var/www/portfolio;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Eigene 404-Seite im Terminal-Stil (WICHTIG: muss gesetzt werden,
    # sonst liefert Nginx seine Standard-Fehlerseite)
    error_page 404 /404.html;
    location = /404.html { internal; }

    # Etwas Caching für statische Assets
    location ~* \.(css|js|png|jpg|jpeg|webp|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

Aktivieren:

```bash
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### Nginx Security-Header

Folgenden Block in den `server{}`-Block einfügen, danach `nginx -t` und
`systemctl reload nginx`:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
```

**Warum `style-src` mit `'unsafe-inline'`:** Der Topologie-Graph in beiden
index-Seiten nutzt `style="--d:…"`-Attribute für die gestaffelten
Animations-Delays. Eine strikte `style-src 'self'` blockiert diese
Attribute — der Graph erscheint dann ohne Staffelung auf einen Schlag.
Für Inline-**Styles** ist das Risiko auf einer statischen Seite ohne
Nutzereingaben minimal; Inline-**Skripte** bleiben durch `script-src 'self'`
strikt verboten (im Code gibt es keine — geprüft).

**Nach dem Setzen:** Die Seite komplett durchklicken (auch Boot-Sequenz,
Topologie-Graph, Sprachwechsel DE/EN, 404-Seite) und die Browser-Konsole
auf CSP-Fehler prüfen. Danach mit securityheaders.com testen — Ziel: A.

### Beispiel-Konfiguration: Caddy (Alternative)

`/etc/caddy/Caddyfile` – hinter Cloudflare Tunnel reicht Port 80 ohne Auto-HTTPS:

```caddy
:80 {
    root * /var/www/portfolio
    file_server
    encode gzip
}
```

## Veröffentlichung

- HTTPS übernimmt Cloudflare automatisch (Universal SSL + Tunnel).
- Cloudflare Tunnel zeigt auf `http://localhost:80` der LXC.
- Proxmox-Webinterface (Port 8006) bleibt intern und wird NICHT veröffentlicht.
- Nur der Webserver in der LXC ist öffentlich erreichbar.

## Livegang-Checkliste

- [ ] Impressum vollständig ausgefüllt (Name, Anschrift, E-Mail)?
- [ ] Datenschutzerklärung geprüft und an tatsächliches Setup angepasst
      (Nginx-Logs, Cloudflare-Hinweis, Datum)?
- [ ] E-Mail-Adresse in Kontakt-Sektion korrekt?
- [ ] GitHub-Link eingesetzt?
- [ ] LinkedIn-Link eingesetzt?
- [ ] Alle `[PLATZHALTER]` im Code ersetzt? (`grep -rn "PLATZHALTER" .`)
- [ ] Keine externen Fonts? (ja – nur Systemfonts)
- [ ] Keine externen Skripte/CDNs? (ja – alles lokal)
- [ ] Keine Trackingtools, keine Cookies? (ja)
- [ ] Mobile Ansicht getestet (Smartphone + schmales Browserfenster)?
- [ ] HTTPS aktiv (Schloss-Symbol im Browser)?
- [ ] Proxmox-Webinterface von außen NICHT erreichbar?
- [ ] Backup des LXC vorhanden (Proxmox-Backup-Job deckt Container ab)?
