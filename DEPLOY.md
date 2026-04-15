# Cloudflare Pages Deploy Checklist

- [ ] Variabile setate în Cloudflare
- [ ] Domeniu www.ocupaloc.ro legat
- [ ] Test login/signup
- [ ] Test dashboard
- [ ] Test booking flow
- [ ] Analytics activ

## Verificări rapide după deploy

- URL preview Cloudflare răspunde cu 200
- `/login` și `/signup` funcționează
- `/dashboard` redirecționează corect când nu ești autentificat
- `/api/auth/signout` răspunde fără erori
- `sitemap.xml` și `robots.txt` servite corect
