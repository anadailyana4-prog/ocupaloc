# Vercel Deploy Checklist

- [ ] Variabile setate în Vercel (Production + Preview)
- [ ] Domeniile `ocupaloc.ro` și `www.ocupaloc.ro` configurate în Vercel
- [ ] Test login/signup
- [ ] Test dashboard
- [ ] Test booking flow
- [ ] Analytics activ

## Verificări rapide după deploy

- URL preview Vercel răspunde cu 200
- `/login` și `/signup` funcționează
- `/dashboard` redirecționează corect când nu ești autentificat
- `/api/auth/signout` răspunde fără erori
- `sitemap.xml` și `robots.txt` servite corect
